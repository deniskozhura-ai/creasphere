import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getProducts } from '@/lib/products-store';
import { getOrders } from '@/lib/orders-store';
import { getDemoBookings } from '@/lib/bookings-store';
import { getCustomOrders } from '@/lib/custom-orders-store';
import { getSpaceBookings } from '@/lib/space-bookings-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Адмін-панель — CreaSphere',
};

export default async function AdminDashboardPage() {
  const allProducts = getProducts();
  const allOrders = getOrders();
  const allBookings = getDemoBookings();
  const allCustomOrders = getCustomOrders();
  const allSpaceBookings = getSpaceBookings();

  let productsCount = allProducts.length;
  let ordersCount = allOrders.length;
  let totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  let bookings = allBookings;
  let bookingsCount = allBookings.length;
  let customOrdersCount = allCustomOrders.length;
  let spaceBookingsCount = allSpaceBookings.length;

  let recentOrders = allOrders.slice(0, 5);

  if (isSupabaseConfigured) {
    try {
      const { count: pCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (pCount !== null) productsCount = pCount;

      const { data: orders, count: oCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      if (oCount !== null) ordersCount = oCount;
      if (orders && orders.length > 0) {
        recentOrders = orders;
        totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      }

      const { data: dbBookings, count: bCount } = await supabase
        .from('workshop_bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      if (bCount !== null) bookingsCount = bCount;
      if (dbBookings && dbBookings.length > 0) {
        bookings = dbBookings;
      }
    } catch (e) {
      console.warn('Supabase admin stats error:', e.message);
    }
  }

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
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Панель керування</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Огляд ключових показників магазину, майстер-класів та простору CreaSphere
          </p>
        </div>
      </div>

      {/* ── Metric Cards Grid ── */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">🧸</div>
          <div className="admin-stat-card__value">{productsCount}</div>
          <div className="admin-stat-card__label">Товарів у каталозі</div>
          <Link href="/admin/products" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Керувати товарами →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">📦</div>
          <div className="admin-stat-card__value">{ordersCount}</div>
          <div className="admin-stat-card__label">Замовлень магазину</div>
          <Link href="/admin/orders" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Всі замовлення →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">💰</div>
          <div className="admin-stat-card__value">{totalRevenue.toLocaleString('uk-UA')} ₴</div>
          <div className="admin-stat-card__label">Виручка магазину</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">🎨</div>
          <div className="admin-stat-card__value">{bookingsCount}</div>
          <div className="admin-stat-card__label">Записів на МК</div>
          <Link href="/admin/bookings" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Переглянути записи →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">✨</div>
          <div className="admin-stat-card__value">{customOrdersCount}</div>
          <div className="admin-stat-card__label">Кастомних виробів</div>
          <Link href="/admin/custom-orders" style={{ fontSize: 12, color: 'var(--sage, #606c38)', marginTop: 8, display: 'inline-block' }}>
            Дзвінки клієнтам →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon">🏛️</div>
          <div className="admin-stat-card__value">{spaceBookingsCount}</div>
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
              Всі ({allCustomOrders.length}) →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allCustomOrders.slice(0, 3).map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-warm)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.customer_name}</div>
                  <a href={`tel:${item.customer_phone}`} style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                    {item.customer_phone} 📞
                  </a>
                </div>
                <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 8, background: item.status === 'pending_call' ? '#fef3c7' : '#e0e7ff', color: item.status === 'pending_call' ? '#b45309' : '#4338ca', fontWeight: 600 }}>
                  {item.status === 'pending_call' ? 'Очікує дзвінка' : 'Зв\'язалися'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Space Rentals */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🏛️ Заявки на оренду простору</h3>
            <Link href="/admin/space" style={{ fontSize: 13, color: 'var(--sage, #606c38)', textDecoration: 'none' }}>
              Всі ({allSpaceBookings.length}) →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allSpaceBookings.slice(0, 3).map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-warm)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.customer_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.event_type} • {item.event_date}</div>
                </div>
                <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 8, background: item.status === 'new' ? '#fef3c7' : '#ecfdf5', color: item.status === 'new' ? '#b45309' : '#047857', fontWeight: 600 }}>
                  {item.status === 'new' ? 'Нова' : 'Підтверджено'}
                </span>
              </div>
            ))}
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
              {bookings.slice(0, 5).map((b) => (
                <tr key={b.id || b.booking_number}>
                  <td style={{ fontWeight: 600 }}>{b.booking_number}</td>
                  <td>{b.customer_name}</td>
                  <td>{b.customer_phone}</td>
                  <td style={{ fontWeight: 500 }}>{b.workshop_title}</td>
                  <td>{b.participants_count} люд.</td>
                  <td style={{ fontSize: 13 }}>{b.preferred_date}</td>
                  <td>{getWkBadge(b.status)}</td>
                </tr>
              ))}
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
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.customer_phone}</td>
                  <td style={{ fontWeight: 600 }}>{order.total_amount} ₴</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
