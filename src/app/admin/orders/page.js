import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const metadata = {
  title: 'Замовлення — CreaSphere Admin',
};

export default async function AdminOrdersPage() {
  let orders = [
    {
      id: '1',
      order_number: 'CS-849201',
      customer_name: 'Олена Петренко',
      customer_phone: '+380 99 234 5678',
      customer_email: 'olena.p@gmail.com',
      delivery_address: 'м. Київ, Нова Пошта Відділення № 45',
      delivery_method: 'nova_poshta',
      payment_method: 'card',
      total_amount: 1130,
      status: 'completed',
      created_at: '2026-09-08 14:30',
    },
    {
      id: '2',
      order_number: 'CS-849195',
      customer_name: 'Михайло Сидоренко',
      customer_phone: '+380 67 345 6789',
      customer_email: 'm.sydorenko@ukr.net',
      delivery_address: 'м. Павлоград, вул. Центральна, 12 (Самовивіз)',
      delivery_method: 'pickup',
      payment_method: 'cash',
      total_amount: 750,
      status: 'pending',
      created_at: '2026-09-08 11:15',
    },
    {
      id: '3',
      order_number: 'CS-849180',
      customer_name: 'Анна Коваль',
      customer_phone: '+380 50 123 4567',
      customer_email: 'koval_a@gmail.com',
      delivery_address: 'м. Дніпро, Поштомат № 1234',
      delivery_method: 'nova_poshta',
      payment_method: 'card',
      total_amount: 1570,
      status: 'processing',
      created_at: '2026-09-07 19:42',
    },
  ];

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        orders = data;
      }
    } catch (e) {
      console.warn('Supabase orders fetch error:', e.message);
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

  const getDeliveryLabel = (method) => {
    switch (method) {
      case 'pickup':
        return 'Самовивіз';
      case 'ukrposhta':
        return 'Укрпошта';
      default:
        return 'Нова Пошта';
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Замовлення клієнтів</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Всього замовлень: {orders.length}
          </p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Клієнт</th>
              <th>Контакти</th>
              <th>Доставка</th>
              <th>Сума</th>
              <th>Оплата</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                <td>{order.customer_name}</td>
                <td>
                  <div>{order.customer_phone}</div>
                  {order.customer_email && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {order.customer_email}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: 13, maxWidth: 220 }}>
                  <div style={{ fontWeight: 500 }}>{getDeliveryLabel(order.delivery_method)}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.delivery_address || '—'}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{order.total_amount} ₴</td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {order.payment_method === 'card' ? 'Картка' : 'Готівка / Післяплата'}
                </td>
                <td>{getStatusBadge(order.status)}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {order.created_at?.slice(0, 16).replace('T', ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
