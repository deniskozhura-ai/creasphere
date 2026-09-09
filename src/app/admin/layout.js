'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminLoginForm from '@/components/AdminLoginForm';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(null); // null = checking, false = show login, true = authenticated

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        setIsAuth(!!data.authenticated);
      })
      .catch(() => {
        setIsAuth(false);
      });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    setIsAuth(false);
  };

  if (isAuth === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f6f0',
          color: 'var(--text-muted, #777)',
          fontSize: 15,
        }}
      >
        <span>Перевірка доступу до панелі...</span>
      </div>
    );
  }

  if (!isAuth) {
    return <AdminLoginForm onLoginSuccess={() => setIsAuth(true)} />;
  }

  const links = [
    { href: '/admin', label: 'Головна панель', icon: '📊' },
    { href: '/admin/products', label: 'Товари', icon: '🧸' },
    { href: '/admin/categories', label: 'Категорії', icon: '🏷️' },
    { href: '/admin/orders', label: 'Замовлення', icon: '📦' },
    { href: '/admin/custom-orders', label: 'Кастомні вироби', icon: '✨' },
    { href: '/admin/bookings', label: 'Записи на МК', icon: '🎨' },
    { href: '/admin/space', label: 'Оренда простору', icon: '🏛️' },
    { href: '/shop', label: 'Перейти в магазин', icon: '🌐' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <Link href="/" className="header__logo" aria-label="CreaSphere">
            <div className="logo logo--light">
              <span className="logo__cs">CS</span>
              <span className="logo__divider"></span>
              <div className="logo__words">
                <span>CREA</span>
                <span>SPHERE</span>
              </div>
            </div>
          </Link>
          <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Панель керування
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {links.map((link) => {
            const isActive = link.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(link.href) && link.href !== '/shop';

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`admin-sidebar__link ${isActive ? 'active' : ''}`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: 14,
              padding: '8px 0',
              textAlign: 'left',
            }}
          >
            <span>🚪</span>
            <span>Вийти з адмінки</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
