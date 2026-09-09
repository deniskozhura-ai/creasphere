import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  verifyAdminPassword,
  createAdminSession,
  isValidAdminSession,
  revokeAdminSession,
  getSessionTokenFromRequest,
} from '@/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request) {
  try {
    const token = await getSessionTokenFromRequest(request);

    if (token && isValidAdminSession(token)) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false });
  } catch (err) {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(request) {
  try {
    // 1. Rate limiting: 5 failed attempts per 15 minutes per IP
    const rateLimitResponse = applyRateLimit(request, 'admin-login', 5, 15 * 60 * 1000);
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
      return NextResponse.json(
        { error: 'Невірний пароль адміністратора. Спробуйте ще раз.' },
        { status: 401 }
      );
    }

    // 3. Create cryptographically secure session
    const sessionToken = createAdminSession();

    // 4. Set HttpOnly Secure Cookie
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
      revokeAdminSession(token);
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
