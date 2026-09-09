import Link from 'next/link';

export const metadata = {
  title: 'Сторінку не знайдено — 404 | CreaSphere',
};

export default function NotFound() {
  return (
    <main style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div
        style={{
          maxWidth: 600,
          textAlign: 'center',
          background: 'var(--bg-card, #fff)',
          padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5vw, 48px)',
          borderRadius: 'var(--radius-lg, 24px)',
          border: '1px solid var(--border, rgba(0,0,0,0.08))',
          boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(72px, 12vw, 120px)',
            fontWeight: 700,
            lineHeight: 1,
            color: 'var(--sage, #606c38)',
            marginBottom: 12,
            opacity: 0.9,
          }}
        >
          404
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 4vw, 36px)',
            marginBottom: 16,
            color: 'var(--text, #283618)',
          }}
        >
          Сторінку не знайдено
        </h1>

        <p
          style={{
            color: 'var(--text-muted, #666)',
            fontSize: 16,
            lineHeight: 1.6,
            marginBottom: 36,
            maxWidth: 460,
            margin: '0 auto 36px',
          }}
        >
          Здається, адреса змінилася або сторінка була переміщена. Але в нашому творчому просторі завжди є безліч цікавих речей!
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/shop" className="btn btn--primary">
            <span>Каталог магазину</span>
          </Link>
          <Link href="/workshops" className="btn btn--ghost">
            <span>Майстер-класи</span>
          </Link>
          <Link href="/" className="btn btn--ghost">
            <span>На головну</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
