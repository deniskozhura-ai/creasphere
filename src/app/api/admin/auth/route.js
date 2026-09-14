import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  verifyAdminPassword,
  createAdminSession,
  isValidAdminSession,
  revokeAdminSession,
  getSessionTokenFromRequest,
  checkAdminBruteForce,
  recordFailedLogin,
  resetFailedLogins,
} from '@/lib/auth';
import { applyRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request) {
  try {
    const token = await getSessionTokenFromRequest(request);

    if (token && (await isValidAdminSession(token))) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false });
  } catch (err) {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    // 1. Fail-fast brute force check: after 5 failed attempts in 15 mins -> 429
    const bruteForce = await checkAdminBruteForce(ip);
    if (bruteForce.blocked) {
      return NextResponse.json(
        { error: 'Забагато невдалих спроб входу. Спробуйте пізніше.' },
        { status: 429, headers: { 'Retry-After': String(bruteForce.retryAfter || 900) } }
      );
    }

    // Secondary rate limiting: prevents general resource exhaustion
    const rateLimitResponse = await applyRateLimit(request, `admin-login:${ip}`, 20, 15 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Будь ласка, введіть пароль' },
        { status: 400 }
      );
    }

    // 2. Timing-safe verification
    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      await recordFailedLogin(ip);
      return NextResponse.json(
        { error: 'Невірний пароль адміністратора. Спробуйте ще раз.' },
        { status: 401 }
      );
    }

    // 3. Reset failed attempts counter on successful login
    await resetFailedLogins(ip);

    // 4. Create cryptographically secure persistent session (SHA-256 hashed in DB with admin_login)
    const adminLogin = process.env.ADMIN_LOGIN || 'admin';
    const sessionToken = await createAdminSession(adminLogin);

    // 5. Set HttpOnly Secure SameSite Cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Успішний вхід до панелі керування',
    });
  } catch (err) {
    console.error('Admin authentication error:', err);
    if (err.message && err.message.includes('unavailable in production')) {
      return NextResponse.json(
        { error: 'Служба авторизації тимчасово недоступна в production. Спробуйте пізніше.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Помилка авторизації. Спробуйте пізніше.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const token = await getSessionTokenFromRequest(request);
    if (token) {
      await revokeAdminSession(token);
    }

    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Ви вийшли з панелі керування',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Помилка виходу' },
      { status: 500 }
    );
  }
}
