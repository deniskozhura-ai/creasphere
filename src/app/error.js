'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <main style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div
        style={{
          maxWidth: 560,
          textAlign: 'center',
          background: 'var(--bg-card, #fff)',
          padding: 'clamp(40px, 6vw, 60px) clamp(24px, 5vw, 44px)',
          borderRadius: 'var(--radius-lg, 24px)',
          border: '1px solid var(--border, rgba(0,0,0,0.08))',
          boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 3.5vw, 32px)',
            marginBottom: 14,
            color: 'var(--text, #283618)',
          }}
        >
          Щось пішло не так
        </h1>

        <p
          style={{
            color: 'var(--text-muted, #666)',
            fontSize: 15,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          Під час завантаження сталася непередбачувана помилка. Будь ласка, спробуйте оновити сторінку або поверніться на головну.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn--primary"
            style={{ cursor: 'pointer' }}
          >
            <span>Спробувати ще раз</span>
          </button>
          <Link href="/" className="btn btn--ghost">
            <span>На головну</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
