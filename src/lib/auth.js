import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseAdminConfigured } from './supabase-admin';

export const AUTH_COOKIE_NAME = 'creasphere_admin_auth';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Local persistent store path used strictly in development/test environment
const DEV_SESSION_STORE = path.join(os.tmpdir(), 'creasphere_admin_sessions.json');

/**
 * Computes SHA-256 hash of raw session token
 * Raw token is NEVER stored in the database!
 */
export function hashSessionToken(token) {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Helper for dev/test fallback persistent session storage
 * STRICTLY restricted to development / test environments!
 */
function readDevSessions() {
  if (process.env.NODE_ENV === 'production') return [];
  try {
    if (fs.existsSync(DEV_SESSION_STORE)) {
      const data = JSON.parse(fs.readFileSync(DEV_SESSION_STORE, 'utf-8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    // ignore read error
  }
  return [];
}

function writeDevSessions(sessions) {
  if (process.env.NODE_ENV === 'production') return;
  try {
    fs.writeFileSync(DEV_SESSION_STORE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (e) {
    // ignore write error
  }
}

/**
 * Validates admin password against environment variable
 * Rejects immediately if ADMIN_PASSWORD is not set - NO FALLBACKS!
 */
export function verifyAdminPassword(inputPassword) {
  if (!inputPassword || typeof inputPassword !== 'string') return false;

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || expectedPassword.trim().length === 0) {
    console.error('[SECURITY ERROR] ADMIN_PASSWORD environment variable is NOT configured. Admin login rejected.');
    return false;
  }

  const inputBuffer = Buffer.from(inputPassword.trim());
  const expectedBuffer = Buffer.from(expectedPassword.trim());

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

/**
 * Creates a cryptographically random session token,
 * hashes it with SHA-256, and stores the hash in the persistent database.
 * Returns the raw unhashed token to be placed in HttpOnly cookie.
 *
 * FAIL CLOSED in production: If database is unavailable, NEVER fall back to local disk/memory!
 */
export async function createAdminSession() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  if (isSupabaseAdminConfigured) {
    try {
      const supabase = getServiceSupabase();
      const { error } = await supabase.from('admin_sessions').insert([
        {
          token_hash: tokenHash,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          revoked_at: null,
        },
      ]);

      if (error) {
        console.error('[SECURITY ERROR] Failed to save session to Supabase:', error.message);
        throw new Error('Database session creation failed');
      }
      return rawToken;
    } catch (err) {
      console.error('Session creation DB error:', err);
      throw err;
    }
  }

  // Production requirement: FAIL CLOSED. Do NOT fall back to local file or memory.
  if (process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL SECURITY ERROR] Production session store is unavailable. Denying session creation.');
    throw new Error('Persistent session store unavailable in production');
  }

  // Development/test persistent fallback (only in non-production)
  const sessions = readDevSessions().filter((s) => new Date(s.expires_at) > now);
  sessions.push({
    token_hash: tokenHash,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    revoked_at: null,
  });
  writeDevSessions(sessions);

  return rawToken;
}

/**
 * Validates if a raw session token is valid and unrevoked in the database.
 * Hashes incoming token with SHA-256 before lookup.
 *
 * FAIL CLOSED in production: If database is unavailable, return false.
 */
export async function isValidAdminSession(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return false;

  const tokenHash = hashSessionToken(rawToken);
  if (!tokenHash) return false;

  const now = new Date();

  if (isSupabaseAdminConfigured) {
    try {
      const supabase = getServiceSupabase();
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('token_hash, expires_at, revoked_at')
        .eq('token_hash', tokenHash)
        .is('revoked_at', null)
        .gt('expires_at', now.toISOString())
        .maybeSingle();

      if (error) {
        console.error('Session validation error:', error.message);
        return false;
      }

      return Boolean(data);
    } catch (err) {
      console.error('Session lookup exception:', err);
      return false;
    }
  }

  // Production requirement: FAIL CLOSED.
  if (process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL SECURITY ERROR] Production session store is unavailable. Denying validation.');
    return false;
  }

  // Development/test persistent fallback
  const sessions = readDevSessions();
  const session = sessions.find((s) => s.token_hash === tokenHash);
  if (!session) return false;

  if (session.revoked_at) return false;
  if (new Date(session.expires_at) <= now) return false;

  return true;
}

/**
 * Revokes an admin session in the persistent database.
 *
 * FAIL CLOSED in production: If database is unavailable, throw error.
 */
export async function revokeAdminSession(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return false;

  const tokenHash = hashSessionToken(rawToken);
  const now = new Date().toISOString();

  if (isSupabaseAdminConfigured) {
    try {
      const supabase = getServiceSupabase();
      const { error } = await supabase
        .from('admin_sessions')
        .update({ revoked_at: now })
        .eq('token_hash', tokenHash);

      if (error) {
        console.error('Session revocation error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Session revocation exception:', err);
      return false;
    }
  }

  // Production requirement: FAIL CLOSED.
  if (process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL SECURITY ERROR] Production session store is unavailable for revocation.');
    throw new Error('Persistent session store unavailable in production');
  }

  // Development/test persistent fallback
  const sessions = readDevSessions();
  let found = false;
  const updated = sessions.map((s) => {
    if (s.token_hash === tokenHash) {
      found = true;
      return { ...s, revoked_at: now };
    }
    return s;
  });
  writeDevSessions(updated);
  return found;
}

/**
 * Extracts session token from incoming Request or cookies()
 */
export async function getSessionTokenFromRequest(request) {
  // 1. Try Authorization header: Bearer <token>
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
  }

  // 2. Try request cookies header
  if (request) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
      if (match) {
        return match.split('=')[1]?.trim();
      }
    }
  }

  // 3. Try Next.js cookies() API
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (cookie?.value) return cookie.value;
  } catch (e) {
    // cookies() may not be available in all contexts
  }

  return null;
}

/**
 * Server-side guard for protected Admin API routes
 * Returns null if authorized, or NextResponse (401 / 403 / 503) if invalid or unavailable
 */
export async function requireAdmin(request) {
  if (process.env.NODE_ENV === 'production' && !isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: 'Сервіс авторизації тимчасово недоступний (конфігурація сховища)' },
      { status: 503 }
    );
  }

  const token = await getSessionTokenFromRequest(request);

  if (!token || !(await isValidAdminSession(token))) {
    return NextResponse.json(
      { error: 'Доступ заборонено: потрібна авторизація адміністратора' },
      { status: 401 }
    );
  }

  // CSRF validation on state-changing methods (POST, PUT, PATCH, DELETE)
  if (request && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method?.toUpperCase())) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { error: 'Недійсне джерело запиту (CSRF protection)' },
            { status: 403 }
          );
        }
      } catch (e) {
        return NextResponse.json({ error: 'Помилка валідації запиту' }, { status: 403 });
      }
    }
  }

  return null; // Authorized
}
