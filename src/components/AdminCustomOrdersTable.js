'use client';

import { useState } from 'react';

export default function AdminCustomOrdersTable({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/custom-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id || o.order_number === id ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_call':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
            📞 Очікує дзвінка
          </span>
        );
      case 'called':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#e0e7ff', color: '#4338ca' }}>
            💬 Зв'язалися
          </span>
        );
      case 'in_progress':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#ecfdf5', color: '#047857' }}>
            🧶 В роботі
          </span>
        );
      case 'completed':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#f3f4f6', color: '#374151' }}>
            ✓ Виконано
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border, #e5e7eb)', paddingBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Всі заявки', count: orders.length },
          { id: 'pending_call', label: 'Очікують дзвінка', count: orders.filter((o) => o.status === 'pending_call').length },
          { id: 'called', label: "Зв'язалися", count: orders.filter((o) => o.status === 'called').length },
          { id: 'in_progress', label: 'В роботі', count: orders.filter((o) => o.status === 'in_progress').length },
          { id: 'completed', label: 'Виконано', count: orders.filter((o) => o.status === 'completed').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: filterStatus === tab.id ? 'none' : '1px solid var(--border, #d1d5db)',
              background: filterStatus === tab.id ? 'var(--text, #283618)' : 'transparent',
              color: filterStatus === tab.id ? '#fff' : 'var(--text, #333)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                background: filterStatus === tab.id ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Клієнт</th>
              <th>Номер телефону</th>
              <th>Статус</th>
              <th>Змінити статус</th>
              <th>Дата заявки</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.order_number}</td>
                  <td style={{ fontWeight: 500 }}>{item.customer_name}</td>
                  <td>
                    <a
                      href={`tel:${item.customer_phone.replace(/\s+/g, '')}`}
                      style={{ color: 'var(--sage, #606c38)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {item.customer_phone} 📞
                    </a>
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        border: '1px solid var(--border, #ccc)',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="pending_call">Очікує дзвінка</option>
                      <option value="called">Зв'язалися</option>
                      <option value="in_progress">В роботі</option>
                      <option value="completed">Виконано</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted, #777)' }}>{item.created_at}</td>
                  <td>
                    <a
                      href={`tel:${item.customer_phone.replace(/\s+/g, '')}`}
                      className="btn btn--ghost"
                      style={{ padding: '4px 12px', fontSize: 12, borderRadius: 8, textDecoration: 'none' }}
                    >
                      Подзвонити
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  Заявок не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
