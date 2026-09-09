import fs from 'fs';
import path from 'path';
import os from 'os';
import { NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseAdminConfigured } from './supabase-admin';

// Local persistent store path used strictly as dev/test fallback when external store is unavailable
const DEV_RATE_LIMIT_STORE = path.join(os.tmpdir(), 'creasphere_rate_limit.json');

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isUpstashConfigured = Boolean(
  upstashUrl &&
  upstashToken &&
  !upstashUrl.includes('placeholder') &&
  !upstashToken.includes('placeholder')
);

/**
 * Reads dev persistent rate limit records
 */
function readDevRateLimits() {
  try {
    if (fs.existsSync(DEV_RATE_LIMIT_STORE)) {
      const data = JSON.parse(fs.readFileSync(DEV_RATE_LIMIT_STORE, 'utf-8'));
      return data && typeof data === 'object' ? data : {};
    }
  } catch (e) {}
  return {};
}

function writeDevRateLimits(records) {
  try {
    fs.writeFileSync(DEV_RATE_LIMIT_STORE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e) {}
}

/**
 * Extracts client IP address safely considering proxy chains
 */
export function getClientIp(request) {
  if (!request) return '127.0.0.1';

  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Upstash Redis-backed distributed rate limiter
 */
async function rateLimitUpstash(identifier, limit, windowMs) {
  const key = `rate_limit:${identifier}`;
  const pipeline = [
    ['INCR', key],
    ['PTTL', key],
  ];

  const res = await fetch(`${upstashUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pipeline),
  });

  if (!res.ok) {
    throw new Error(`Upstash HTTP error: ${res.statusText}`);
  }

  const results = await res.json();
  const currentCount = results[0].result;
  let pttl = results[1].result;

  if (pttl === -1) {
    // Key has no expire, set window
    await fetch(`${upstashUrl}/pexpire/${key}/${windowMs}`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    pttl = windowMs;
  }

  const retryAfter = pttl > 0 ? Math.ceil(pttl / 1000) : Math.ceil(windowMs / 1000);

  if (currentCount > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      totalLimit: limit,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - currentCount),
    retryAfter: 0,
    totalLimit: limit,
  };
}

/**
 * Supabase/PostgreSQL-backed shared rate limiter
 */
async function rateLimitSupabase(identifier, limit, windowMs) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: identifier,
    p_max_requests: limit,
    p_window_ms: windowMs,
  });

  if (error) {
    throw error;
  }

  return {
    allowed: data.allowed,
    remaining: data.remaining,
    retryAfter: data.retryAfter || 0,
    totalLimit: limit,
  };
}

/**
 * Local dev/test persistent rate limiter
 */
function rateLimitDev(identifier, limit, windowMs) {
  const now = Date.now();
  const records = readDevRateLimits();

  const record = records[identifier];
  if (!record || record.resetAt < now) {
    records[identifier] = {
      count: 1,
      resetAt: now + windowMs,
    };
    writeDevRateLimits(records);
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfter: 0,
      totalLimit: limit,
    };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      totalLimit: limit,
    };
  }

  record.count += 1;
  records[identifier] = record;
  writeDevRateLimits(records);

  return {
    allowed: true,
    remaining: limit - record.count,
    retryAfter: 0,
    totalLimit: limit,
  };
}

/**
 * Core rate limiting abstraction
 * @param {string} identifier - unique key e.g. "orders:192.168.1.1"
 * @param {number} limit - maximum requests allowed in window
 * @param {number} windowMs - window size in milliseconds
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter: number, totalLimit: number }>}
 */
export async function rateLimit(identifier, limit = 10, windowMs = 60 * 1000) {
  // 1. Try Upstash Redis if configured (Ultra-fast serverless KV)
  if (isUpstashConfigured) {
    try {
      return await rateLimitUpstash(identifier, limit, windowMs);
    } catch (err) {
      console.error('[RATE-LIMIT] Upstash error, falling back to database:', err.message);
    }
  }

  // 2. Try Supabase shared PostgreSQL rate limit function
  if (isSupabaseAdminConfigured) {
    try {
      return await rateLimitSupabase(identifier, limit, windowMs);
    } catch (err) {
      console.error('[RATE-LIMIT] Supabase rate limit error:', err.message);
    }
  }

  // 3. Fallback for offline local dev and test environment
  if (process.env.NODE_ENV === 'production' && !isUpstashConfigured && !isSupabaseAdminConfigured) {
    console.error('[CRITICAL SECURITY WARNING] Shared rate limiting store (Upstash/Supabase) is not configured in production!');
  }

  return rateLimitDev(identifier, limit, windowMs);
}

/**
 * Convenience helper to enforce rate limits on API route requests
 * Returns NextResponse (429) if rate limited, or null if allowed
 */
export async function applyRateLimit(request, action = 'default', maxRequests = 10, windowMs = 60 * 1000) {
  const ip = getClientIp(request);
  const identifier = `${action}:${ip}`;
  const result = await rateLimit(identifier, maxRequests, windowMs);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: `Забагато запитів. Будь ласка, зачекайте ${result.retryAfter} сек. перед наступною спробою.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(result.totalLimit),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      }
    );
  }

  return null;
}
