'use client';

import { useState, useEffect } from 'react';

export default function AdminOrdersTable({ initialOrders = [] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Sync with client-side localStorage orders
  useEffect(() => {
    try {
      const localOrders = JSON.parse(localStorage.getItem('creasphere_customer_orders') || '[]');
      if (Array.isArray(localOrders) && localOrders.length > 0) {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.id || o.order_number));
          const newToAdd = localOrders.filter((o) => !existingIds.has(o.id || o.order_number));
          return [...newToAdd, ...prev];
        });
      }
    } catch (e) {
      console.warn('LocalStorage orders read error:', e);
    }
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id || o.order_number === id ? { ...o, status: newStatus } : o))
        );
        try {
          const localOrders = JSON.parse(localStorage.getItem('creasphere_customer_orders') || '[]');
          const updatedLocal = localOrders.map((o) =>
            o.id === id || o.order_number === id ? { ...o, status: newStatus } : o
          );
          localStorage.setItem('creasphere_customer_orders', JSON.stringify(updatedLocal));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Видалити це замовлення?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id && o.order_number !== id));
        try {
          const localOrders = JSON.parse(localStorage.getItem('creasphere_customer_orders') || '[]');
          const updatedLocal = localOrders.filter((o) => o.id !== id && o.order_number !== id);
          localStorage.setItem('creasphere_customer_orders', JSON.stringify(updatedLocal));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Delete order failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchesNumber = o.order_number?.toLowerCase().includes(q);
    const matchesName = o.customer_name?.toLowerCase().includes(q);
    const matchesPhone = o.customer_phone?.toLowerCase().includes(q);
    const matchesCity = o.delivery_city?.toLowerCase().includes(q) || o.delivery_address?.toLowerCase().includes(q);
    const matchesItems = o.items?.some((i) => (i.name || i.product_name)?.toLowerCase().includes(q));
    return matchesNumber || matchesName || matchesPhone || matchesCity || matchesItems;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#ecfdf5', color: '#047857' }}>
            ✓ Виконано
          </span>
        );
      case 'processing':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#e0e7ff', color: '#4338ca' }}>
            ⏳ В обробці
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
            ✕ Скасовано
          </span>
        );
      default:
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
            🔔 Нове
          </span>
        );
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
      {/* Controls & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Пошук за номером, клієнтом, телефоном чи товаром..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid var(--border, #d1d5db)',
            width: 360,
            maxWidth: '100%',
            fontSize: 14,
          }}
        />

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Всі (${orders.length})` },
            { id: 'pending', label: `🔔 Нові (${orders.filter((o) => o.status === 'pending' || !o.status).length})` },
            { id: 'processing', label: `⏳ В обробці (${orders.filter((o) => o.status === 'processing').length})` },
            { id: 'completed', label: `✓ Виконані (${orders.filter((o) => o.status === 'completed').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: filterStatus === tab.id ? 700 : 500,
                background: filterStatus === tab.id ? 'var(--primary, #606c38)' : '#fff',
                color: filterStatus === tab.id ? '#fff' : 'var(--text, #283618)',
                border: '1px solid var(--border, #d1d5db)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Номер / Дата</th>
              <th>Клієнт</th>
              <th>Доставка</th>
              <th>Товари у замовленні</th>
              <th>Сума</th>
              <th>Оплата</th>
              <th>Статус</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id || order.order_number}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary, #606c38)', fontSize: 14 }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {order.created_at?.slice(0, 16).replace('T', ' ')}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                    <a
                      href={`tel:${order.customer_phone}`}
                      style={{ fontSize: 13, color: 'var(--primary, #606c38)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {order.customer_phone}
                    </a>
                    {order.customer_email && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.customer_email}</div>
                    )}
                  </td>

                  <td style={{ fontSize: 13, maxWidth: 200 }}>
                    <span style={{ fontWeight: 600, fontSize: 12, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                      {getDeliveryLabel(order.delivery_method)}
                    </span>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                      {order.delivery_city ? `${order.delivery_city}, ` : ''}
                      {order.delivery_address || '—'}
                    </div>
                  </td>

                  <td style={{ maxWidth: 240 }}>
                    {order.items && order.items.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            {item.image && (
                              <img
                                src={item.image}
                                alt=""
                                style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }}
                              />
                            )}
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 600 }}>{item.quantity}×</span> {item.name || item.product_name}
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div style={{ fontSize: 11, color: 'var(--primary, #606c38)', fontWeight: 600 }}>
                            + ще {order.items.length - 2} товар(ів)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  <td style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                    {Number(order.total_amount || 0).toFixed(2)} ₴
                  </td>

                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {order.payment_method === 'card' ? '💳 Онлайн / Картка' : '💵 Готівка / Післяплата'}
                  </td>

                  <td>
                    <select
                      value={order.status || 'pending'}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id || order.order_number, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        border: '1px solid #d1d5db',
                        background:
                          order.status === 'completed'
                            ? '#ecfdf5'
                            : order.status === 'processing'
                            ? '#e0e7ff'
                            : order.status === 'cancelled'
                            ? '#fee2e2'
                            : '#fef3c7',
                        color:
                          order.status === 'completed'
                            ? '#047857'
                            : order.status === 'processing'
                            ? '#4338ca'
                            : order.status === 'cancelled'
                            ? '#b91c1c'
                            : '#b45309',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="pending">🔔 Новий</option>
                      <option value="processing">⏳ В обробці</option>
                      <option value="completed">✓ Виконано</option>
                      <option value="cancelled">✕ Скасовано</option>
                    </select>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn--ghost"
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 8 }}
                      >
                        Деталі
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order.id || order.order_number)}
                        disabled={deletingId === (order.id || order.order_number)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          borderRadius: 8,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  Замовлень не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Order Receipt Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px 24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                  Замовлення
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--primary, #606c38)' }}>
                  {selectedOrder.order_number}
                </h3>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  Створено: {selectedOrder.created_at?.slice(0, 16).replace('T', ' ')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 8 }}>
                👤 Дані клієнта
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><strong>Ім'я:</strong> {selectedOrder.customer_name}</div>
                <div>
                  <strong>Телефон:</strong>{' '}
                  <a href={`tel:${selectedOrder.customer_phone}`} style={{ color: 'var(--primary, #606c38)', fontWeight: 600 }}>
                    {selectedOrder.customer_phone}
                  </a>
                </div>
                {selectedOrder.customer_email && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Email:</strong> {selectedOrder.customer_email}
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Спосіб доставки:</strong> {getDeliveryLabel(selectedOrder.delivery_method)}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Адреса / Відділення:</strong>{' '}
                  {selectedOrder.delivery_city ? `${selectedOrder.delivery_city}, ` : ''}
                  {selectedOrder.delivery_address || '—'}
                </div>
                {selectedOrder.notes && (
                  <div style={{ gridColumn: '1 / -1', background: '#fef3c7', padding: '6px 10px', borderRadius: 8, color: '#92400e' }}>
                    <strong>Коментар клієнта:</strong> {selectedOrder.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 10 }}>
                🛍️ Товари у замовленні ({selectedOrder.items?.length || 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: '#f3f4f6' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name || item.product_name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {item.price} ₴ × {item.quantity} шт
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {(item.price * item.quantity).toFixed(2)} ₴
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Status change */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed #e5e7eb', paddingTop: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Загальна сума до сплати:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary, #606c38)' }}>
                  {Number(selectedOrder.total_amount || 0).toFixed(2)} ₴
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Статус:</span>
                <select
                  value={selectedOrder.status || 'pending'}
                  onChange={(e) => {
                    handleStatusChange(selectedOrder.id || selectedOrder.order_number, e.target.value);
                    setSelectedOrder((prev) => ({ ...prev, status: e.target.value }));
                  }}
                  style={{ padding: '6px 12px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}
                >
                  <option value="pending">🔔 Новий</option>
                  <option value="processing">⏳ В обробці</option>
                  <option value="completed">✓ Виконано</option>
                  <option value="cancelled">✕ Скасовано</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
