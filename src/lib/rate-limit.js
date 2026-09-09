import { NextResponse } from 'next/server';

if (!globalThis.__creasphere_rate_limit) {
  globalThis.__creasphere_rate_limit = new Map();
}
const rateLimitMap = globalThis.__creasphere_rate_limit;

// Cleanup old rate limit buckets
function purgeRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Extracts client IP address safely
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
 * Checks if an operation is allowed under rate limits
 * @param {string} identifier - e.g. "auth:192.168.1.1"
 * @param {number} maxRequests - allowed hits within window
 * @param {number} windowMs - time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60 * 1000) {
  purgeRateLimits();
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0 };
}

/**
 * Convenience helper to enforce rate limit on route requests
 * Returns NextResponse (429) if rate limited, or null if allowed
 */
export function applyRateLimit(request, action = 'default', maxRequests = 10, windowMs = 60 * 1000) {
  const ip = getClientIp(request);
  const key = `${action}:${ip}`;
  const result = checkRateLimit(key, maxRequests, windowMs);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: `Забагато запитів. Будь ласка, зачекайте ${result.retryAfter} сек. перед наступною спробою.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
        },
      }
    );
  }

  return null;
}
