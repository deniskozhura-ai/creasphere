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
          <div className="footer__social">
            <a href="https://instagram.com/creasphere2024" className="footer__social-link" aria-label="Instagram" target="_blank" rel="noopener">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
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
