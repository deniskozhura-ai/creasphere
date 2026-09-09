'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './CartProvider';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  // Don't show header on admin pages (placed after all hooks)
  if (pathname?.startsWith('/admin')) return null;

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    document.body.style.overflow = !menuOpen ? 'hidden' : '';
  };

  const navLinks = [
    { href: '/', label: 'Головна' },
    { href: '/shop', label: 'Магазин' },
    { href: '/workshops', label: 'Майстер-класи' },
    { href: '/rent', label: 'Оренда простору' },
    { href: '/about', label: 'Про нас' },
    { href: '/#services', label: 'Послуги' },
    { href: '/#gallery', label: 'Галерея' },
    { href: '/#contact', label: 'Контакти' },
  ];

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`} id="header">
      <div className="header__inner">
        <Link href="/" className="header__logo" aria-label="CreaSphere — на головну">
          <div className="logo">
            <img src="/logo.webp" alt="CreaSphere" className="logo__img" />
            <div className="logo__info">
              <span className="logo__name">КреаСфера</span>
              <span className="logo__subtitle">Центр креативних індустрій</span>
            </div>
          </div>
        </Link>

        <nav className={`header__nav ${menuOpen ? 'open' : ''}`} id="nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`header__link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => { setMenuOpen(false); document.body.style.overflow = ''; }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header__right">
          <div className="header__socials">
            <a href="https://instagram.com/creasphere2024" className="header__social" target="_blank" rel="noopener" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://t.me/creasphere" className="header__social" target="_blank" rel="noopener" aria-label="Telegram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.5 7.5a.752.752 0 0 0 .104 1.407l4.72 1.57 2.257 6.97a.75.75 0 0 0 1.327.208l2.4-3.2 4.282 3.18a1.5 1.5 0 0 0 2.357-.96l2.97-15.33a1.5 1.5 0 0 0-1.895-1.56z"/></svg>
            </a>
          </div>

          <Link href="/cart" className="header__cart" aria-label="Кошик">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {totalItems > 0 && (
              <span className="header__cart-count">{totalItems}</span>
            )}
          </Link>

          <button
            className={`header__burger ${menuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Відкрити меню"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
