import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'creasphere2024';
const AUTH_COOKIE_NAME = 'creasphere_admin_auth';
const AUTH_TOKEN_VALUE = 'cs_auth_valid_session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);

  if (token && token.value === AUTH_TOKEN_VALUE) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    const correctPassword = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;

    if (!password || password.trim() !== correctPassword.trim()) {
      return NextResponse.json(
        { error: 'Невірний пароль адміністратора. Спробуйте ще раз.' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, AUTH_TOKEN_VALUE, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, message: 'Успішний вхід' });
  } catch (err) {
    console.error('Admin auth error:', err);
    return NextResponse.json({ error: 'Помилка авторизації' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ success: true, message: 'Ви вийшли з панелі керування' });
}
