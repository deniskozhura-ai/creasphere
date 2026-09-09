'use client';

import { useState, useEffect } from 'react';

export default function AdminCustomOrdersTable({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    try {
      const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_orders_list') || '[]');
      if (Array.isArray(localCustom) && localCustom.length > 0) {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.id || o.order_number));
          const newToAdd = localCustom.filter((o) => !existingIds.has(o.id || o.order_number));
          return [...newToAdd, ...prev];
        });
      }
    } catch (e) {
      console.warn('LocalStorage custom orders read error:', e);
    }
  }, []);

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
        try {
          const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_orders_list') || '[]');
          const updatedLocal = localCustom.map((o) =>
            o.id === id || o.order_number === id ? { ...o, status: newStatus } : o
          );
          localStorage.setItem('creasphere_custom_orders_list', JSON.stringify(updatedLocal));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Видалити цю заявку на кастомний виріб?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/custom-orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id && o.order_number !== id));
        try {
          const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_orders_list') || '[]');
          const updatedLocal = localCustom.filter((o) => o.id !== id && o.order_number !== id);
          localStorage.setItem('creasphere_custom_orders_list', JSON.stringify(updatedLocal));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Delete custom order failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q)
    );
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
      {/* Search & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Пошук за клієнтом або номером телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid var(--border, #d1d5db)',
            width: 340,
            maxWidth: '100%',
            fontSize: 14,
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Всі (${orders.length})` },
            { id: 'pending_call', label: `📞 Очікують (${orders.filter((o) => o.status === 'pending_call').length})` },
            { id: 'called', label: `💬 Зв'язалися (${orders.filter((o) => o.status === 'called').length})` },
            { id: 'in_progress', label: `🧶 В роботі (${orders.filter((o) => o.status === 'in_progress').length})` },
            { id: 'completed', label: `✓ Виконано (${orders.filter((o) => o.status === 'completed').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: filterStatus === tab.id ? 700 : 500,
                border: '1px solid var(--border, #d1d5db)',
                background: filterStatus === tab.id ? 'var(--primary, #606c38)' : '#fff',
                color: filterStatus === tab.id ? '#fff' : 'var(--text, #283618)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((item) => (
                <tr key={item.id || item.order_number}>
                  <td style={{ fontWeight: 700, color: 'var(--primary, #606c38)' }}>{item.order_number}</td>
                  <td style={{ fontWeight: 600 }}>{item.customer_name}</td>
                  <td>
                    <a
                      href={`tel:${item.customer_phone?.replace(/\s+/g, '')}`}
                      style={{ color: 'var(--primary, #606c38)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {item.customer_phone} 📞
                    </a>
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id || item.order_number, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        border: '1px solid var(--border, #ccc)',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="pending_call">📞 Очікує дзвінка</option>
                      <option value="called">💬 Зв'язалися</option>
                      <option value="in_progress">🧶 В роботі</option>
                      <option value="completed">✓ Виконано</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted, #777)' }}>{item.created_at}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a
                        href={`tel:${item.customer_phone?.replace(/\s+/g, '')}`}
                        className="btn btn--ghost"
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 8, textDecoration: 'none' }}
                      >
                        Подзвонити
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id || item.order_number)}
                        disabled={deletingId === (item.id || item.order_number)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          borderRadius: 8,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        title="Видалити заявку"
                      >
                        ✕
                      </button>
                    </div>
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
