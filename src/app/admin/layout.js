'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Головна панель', icon: '📊' },
    { href: '/admin/products', label: 'Товари', icon: '🧸' },
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
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
