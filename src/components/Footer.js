'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link href="/" className="footer__logo" aria-label="CreaSphere">
              <div className="logo logo--footer">
                <span className="logo__cs">CS</span>
                <span className="logo__divider"></span>
                <div className="logo__words">
                  <span>CREA</span>
                  <span>SPHERE</span>
                </div>
              </div>
            </Link>
            <p className="footer__tagline">Ваш творчий простір у Павлограді</p>
          </div>
          <div className="footer__nav">
            <Link href="/">Головна</Link>
            <Link href="/shop">Магазин</Link>
            <Link href="/workshops">Майстер-класи</Link>
            <Link href="/rent">Оренда простору</Link>
            <Link href="/about">Про нас</Link>
            <Link href="/#services">Послуги</Link>
            <Link href="/#contact">Контакти</Link>
          </div>
          <div className="footer__social" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="https://instagram.com/creasphere" className="footer__social-link" aria-label="Instagram" target="_blank" rel="noopener">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://t.me/creasphere" className="footer__social-link" aria-label="Telegram" target="_blank" rel="noopener">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.5 7.5a.752.752 0 0 0 .104 1.407l4.72 1.57 2.257 6.97a.75.75 0 0 0 1.327.208l2.4-3.2 4.282 3.18a1.5 1.5 0 0 0 2.357-.96l2.97-15.33a1.5 1.5 0 0 0-1.895-1.56z"/></svg>
            </a>
            <a href="https://www.facebook.com/share/1BQ9KfUqPt/" className="footer__social-link" aria-label="Facebook" target="_blank" rel="noopener">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2024 CreaSphere. Павлоград. Усі права захищені.</span>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link href="/admin" style={{ opacity: 0.55, fontSize: 13, textDecoration: 'none', color: 'inherit' }}>
              🔒 Панель адміністратора
            </Link>
            <span className="footer__credit">Створено з ♥</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
