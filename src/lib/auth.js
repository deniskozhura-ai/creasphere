import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'creasphere_admin_auth';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory session store (backed by globalThis for serverless/dev hot-reloading)
if (!globalThis.__creasphere_sessions) {
  globalThis.__creasphere_sessions = new Map();
}
const sessions = globalThis.__creasphere_sessions;

// Clean up expired sessions periodically
function purgeExpiredSessions() {
  const now = Date.now();
  for (const [token, data] of sessions.entries()) {
    if (data.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

/**
 * Validates the admin password against environment variable
 * Rejects immediately if ADMIN_PASSWORD is not set - NO FALLBACKS!
 */
export function verifyAdminPassword(inputPassword) {
  if (!inputPassword || typeof inputPassword !== 'string') return false;

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || expectedPassword.trim().length === 0) {
    console.error('[SECURITY ERROR] ADMIN_PASSWORD environment variable is NOT configured. Admin login rejected.');
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  const inputBuffer = Buffer.from(inputPassword.trim());
  const expectedBuffer = Buffer.from(expectedPassword.trim());

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

/**
 * Creates a cryptographically random session token
 */
export function createAdminSession() {
  purgeExpiredSessions();
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();

  sessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });

  return token;
}

/**
 * Validates if a session token is valid and not expired
 */
export function isValidAdminSession(token) {
  if (!token || typeof token !== 'string') return false;

  purgeExpiredSessions();
  const session = sessions.get(token);
  if (!session) return false;

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }

  return true;
}

/**
 * Invalidates / revokes a session
 */
export function revokeAdminSession(token) {
  if (!token) return false;
  return sessions.delete(token);
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
 * Returns null if authorized, or NextResponse (401 / 403) if invalid
 */
export async function requireAdmin(request) {
  const token = await getSessionTokenFromRequest(request);

  if (!token || !isValidAdminSession(token)) {
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
