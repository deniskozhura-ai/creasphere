'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboardClient({
  initialStats,
  initialRecentOrders = [],
  initialBookings = [],
  initialCustomOrders = [],
  initialSpaceBookings = [],
}) {
  const [stats, setStats] = useState(initialStats);
  const [recentOrders, setRecentOrders] = useState(initialRecentOrders);
  const [bookings, setBookings] = useState(initialBookings);
  const [customOrders, setCustomOrders] = useState(initialCustomOrders);
  const [spaceBookings, setSpaceBookings] = useState(initialSpaceBookings);

  useEffect(() => {
    try {
      // 1. Orders
      let mergedOrders = [...initialRecentOrders];
      const extraProductsCount = 0;

      // 2. Workshop Bookings
      const localBookings = JSON.parse(localStorage.getItem('creasphere_workshop_bookings') || '[]');
      let mergedBookings = [...initialBookings];
      if (Array.isArray(localBookings) && localBookings.length > 0) {
        const existingBookingIds = new Set(mergedBookings.map((b) => b.id || b.booking_number));
        const newBookings = localBookings.filter((b) => !existingBookingIds.has(b.id || b.booking_number));
        mergedBookings = [...newBookings, ...mergedBookings];
      }

      // 4. Custom Orders
      const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_orders_list') || '[]');
      let mergedCustom = [...initialCustomOrders];
      if (Array.isArray(localCustom) && localCustom.length > 0) {
        const existingCustomIds = new Set(mergedCustom.map((c) => c.id || c.order_number));
        const newCustom = localCustom.filter((c) => !existingCustomIds.has(c.id || c.order_number));
        mergedCustom = [...newCustom, ...mergedCustom];
      }

      // 5. Space Rentals
      const localSpace = JSON.parse(localStorage.getItem('creasphere_space_bookings') || '[]');
      let mergedSpace = [...initialSpaceBookings];
      if (Array.isArray(localSpace) && localSpace.length > 0) {
        const existingSpaceIds = new Set(mergedSpace.map((s) => s.id || s.booking_number));
        const newSpace = localSpace.filter((s) => !existingSpaceIds.has(s.id || s.booking_number));
        mergedSpace = [...newSpace, ...mergedSpace];
      }

      // Recalculate totals
      const totalRevenue = mergedOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      setStats({
        productsCount: initialStats.productsCount + extraProductsCount,
        ordersCount: Math.max(initialStats.ordersCount, mergedOrders.length),
        totalRevenue: Math.max(initialStats.totalRevenue, totalRevenue),
        bookingsCount: Math.max(initialStats.bookingsCount, mergedBookings.length),
        customOrdersCount: Math.max(initialStats.customOrdersCount, mergedCustom.length),
        spaceBookingsCount: Math.max(initialStats.spaceBookingsCount, mergedSpace.length),
      });

      setRecentOrders(mergedOrders.slice(0, 5));
      setBookings(mergedBookings.slice(0, 5));
      setCustomOrders(mergedCustom.slice(0, 5));
      setSpaceBookings(mergedSpace.slice(0, 5));
    } catch (e) {
      console.warn('AdminDashboardClient sync error:', e);
    }
  }, [initialStats, initialRecentOrders, initialBookings, initialCustomOrders, initialSpaceBookings]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="admin-badge admin-badge--completed">Виконано</span>;
      case 'processing':
        return <span className="admin-badge admin-badge--active">В обробці</span>;
      default:
        return <span className="admin-badge admin-badge--pending">Новий</span>;
    }
  };

  const getWkBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="admin-badge admin-badge--active">Підтверджено</span>;
      case 'completed':
        return <span className="admin-badge admin-badge--completed">Завершено</span>;
      default:
        return <span className="admin-badge admin-badge--pending">Новий</span>;
    }
  };

  return (
    <div>
      {/* ── Metric Cards Grid ── */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">🧸</div>
          <div className="admin-stat-card__value">{stats.productsCount}</div>
          <div className="admin-stat-card__label">Товарів у каталозі</div>
          <Link href="/admin/products" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Керувати товарами →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">📦</div>
          <div className="admin-stat-card__value">{stats.ordersCount}</div>
          <div className="admin-stat-card__label">Замовлень магазину</div>
          <Link href="/admin/orders" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Всі замовлення →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">💰</div>
          <div className="admin-stat-card__value">{stats.totalRevenue.toLocaleString('uk-UA')} ₴</div>
          <div className="admin-stat-card__label">Виручка магазину</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">🎨</div>
          <div className="admin-stat-card__value">{stats.bookingsCount}</div>
          <div className="admin-stat-card__label">Записів на МК</div>
          <Link href="/admin/bookings" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Переглянути записи →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">✨</div>
          <div className="admin-stat-card__value">{stats.customOrdersCount}</div>
          <div className="admin-stat-card__label">Кастомних виробів</div>
          <Link href="/admin/custom-orders" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Дзвінки клієнтам →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">🏛️</div>
          <div className="admin-stat-card__value">{stats.spaceBookingsCount}</div>
          <div className="admin-stat-card__label">Оренда простору</div>
          <Link href="/admin/space" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Бронювання залу →
          </Link>
        </div>
      </div>

      {/* ── Two Columns: Recent Custom Orders & Space Rentals ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginTop: 28 }}>
        {/* Custom Orders */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>✨ Запити на кастомні вироби</h3>
            <Link href="/admin/custom-orders" style={{ fontSize: 13, color: 'var(--sage, #606c38)', textDecoration: 'none' }}>
              Всі ({stats.customOrdersCount}) →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {customOrders.length > 0 ? (
              customOrders.slice(0, 3).map((item) => (
                <div key={item.id || item.order_number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-warm)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.customer_name}</div>
                    <a href={`tel:${item.customer_phone}`} style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                      {item.customer_phone} 📞
                    </a>
                  </div>
                  <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 8, background: item.status === 'pending_call' ? '#fef3c7' : '#e0e7ff', color: item.status === 'pending_call' ? '#b45309' : '#4338ca', fontWeight: 600 }}>
                    {item.status === 'pending_call' ? 'Очікує дзвінка' : "Зв'язалися"}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Запитів немає</div>
            )}
          </div>
        </div>

        {/* Space Rentals */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🏛️ Заявки на оренду простору</h3>
            <Link href="/admin/space" style={{ fontSize: 13, color: 'var(--sage, #606c38)', textDecoration: 'none' }}>
              Всі ({stats.spaceBookingsCount}) →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {spaceBookings.length > 0 ? (
              spaceBookings.slice(0, 3).map((item) => (
                <div key={item.id || item.booking_number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-warm)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.customer_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.event_type} • {item.event_date || 'Дата узгоджується'}</div>
                  </div>
                  <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 8, background: item.status === 'new' ? '#fef3c7' : '#ecfdf5', color: item.status === 'new' ? '#b45309' : '#047857', fontWeight: 600 }}>
                    {item.status === 'new' ? 'Нова' : 'Підтверджено'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Заявок немає</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Workshop Bookings Table ── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🎨 Останні записи на майстер-класи</h2>
          <Link href="/admin/bookings" style={{ fontSize: 13, color: 'var(--sage, #606c38)', textDecoration: 'none' }}>
            Усі записи на МК →
          </Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Клієнт</th>
                <th>Телефон</th>
                <th>Майстер-клас</th>
                <th>Учасників</th>
                <th>Дата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? (
                bookings.map((b) => (
                  <tr key={b.id || b.booking_number}>
                    <td style={{ fontWeight: 600 }}>{b.booking_number}</td>
                    <td>{b.customer_name}</td>
                    <td>{b.customer_phone}</td>
                    <td style={{ fontWeight: 500 }}>{b.workshop_title}</td>
                    <td>{b.participants_count} люд.</td>
                    <td style={{ fontSize: 13 }}>{b.preferred_date}</td>
                    <td>{getWkBadge(b.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Записів поки що немає
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Orders Table ── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>📦 Останні замовлення магазину</h2>
          <Link href="/admin/orders" style={{ fontSize: 13, color: 'var(--sage, #606c38)', textDecoration: 'none' }}>
            Усі замовлення магазину →
          </Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Клієнт</th>
                <th>Телефон</th>
                <th>Сума</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id || order.order_number}>
                    <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.customer_phone}</td>
                    <td style={{ fontWeight: 600 }}>{order.total_amount} ₴</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.created_at}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Замовлень поки що немає
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
