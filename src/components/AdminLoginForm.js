'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminLoginForm({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Будь ласка, введіть пароль');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(data.error || 'Невірний пароль');
      }
    } catch (err) {
      setError('Помилка з’єднання. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1c2415 0%, #283618 100%)',
        padding: '24px 20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '40px 32px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(96, 108, 56, 0.12)',
              color: 'var(--sage, #606c38)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              margin: '0 auto 16px',
            }}
          >
            🔒
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px 0', color: '#1c1c1c' }}>
            Панель керування
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
            CreaSphere • Введіть пароль для входу в адмінку
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: 13,
              marginBottom: 20,
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#333' }}>
              Пароль адміністратора
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                placeholder="Введіть ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 16px',
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#888',
                  padding: 4,
                }}
                title={showPassword ? 'Сховати пароль' : 'Показати пароль'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 6,
            }}
          >
            {loading ? 'Перевірка...' : 'Увійти до адмінки ➔'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #eee', fontSize: 13, color: '#888' }}>
          <Link href="/" style={{ color: 'var(--sage, #606c38)', textDecoration: 'none', fontWeight: 600 }}>
            ← Повернутися на головну сайту
          </Link>
        </div>
      </div>
    </div>
  );
}
