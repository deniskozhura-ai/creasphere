'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function AdminCustomOrdersTable({ initialOrders = [] }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState(null);

  const fetchCustomOrders = async () => {
    try {
      const res = await fetch('/api/custom-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (e) {
      console.warn('Live custom orders fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomOrders();
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
        if (selectedOrder && (selectedOrder.id === id || selectedOrder.order_number === id)) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
        try {
          const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_orders_list') || '[]');
          const updatedLocal = localCustom.map((o) =>
            o.id === id || o.order_number === id ? { ...o, status: newStatus } : o
          );
          localStorage.setItem('creasphere_custom_orders_list', JSON.stringify(updatedLocal));
        } catch (e) {}
        showToast(`Статус оновлено на «${getStatusLabel(newStatus)}»`, 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Помилка оновлення статусу', 'error');
      }
    } catch (err) {
      console.error('Status update failed:', err);
      showToast('Помилка з’єднання', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (order) => {
    if (!order) return;
    const id = order.id || order.order_number;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/custom-orders?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id && o.order_number !== id));
        setConfirmDeleteOrder(null);
        if (selectedOrder && (selectedOrder.id === id || selectedOrder.order_number === id)) {
          setSelectedOrder(null);
        }
        try {
          const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_orders_list') || '[]');
          const updatedLocal = localCustom.filter((o) => o.id !== id && o.order_number !== id);
          localStorage.setItem('creasphere_custom_orders_list', JSON.stringify(updatedLocal));
        } catch (e) {}
        showToast('Заявку на кастомний виріб успішно видалено', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Помилка видалення заявки', 'error');
      }
    } catch (err) {
      console.error('Delete custom order failed:', err);
      showToast('Помилка видалення заявки', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_call':
      case 'new':
        return 'Очікує дзвінка';
      case 'called':
        return "Зв'язалися";
      case 'in_progress':
        return 'В роботі';
      case 'completed':
        return 'Виконано';
      case 'cancelled':
        return 'Скасовано';
      default:
        return status;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_call':
      case 'new':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fef3c7', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            📞 Очікує дзвінка
          </span>
        );
      case 'called':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#e0e7ff', color: '#4338ca', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            💬 Зв'язалися
          </span>
        );
      case 'in_progress':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#ecfdf5', color: '#047857', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            🧶 В роботі
          </span>
        );
      case 'completed':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#f3f4f6', color: '#374151', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ✓ Виконано
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ✕ Скасовано
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending_call') {
        if (o.status !== 'pending_call' && o.status !== 'new') return false;
      } else if (o.status !== filterStatus) {
        return false;
      }
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q) ||
      o.category?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q)
    );
  });

  const pendingCount = orders.filter((o) => o.status === 'pending_call' || o.status === 'new').length;
  const calledCount = orders.filter((o) => o.status === 'called').length;
  const inProgressCount = orders.filter((o) => o.status === 'in_progress').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  return (
    <div>
      {/* ── Search & Filter Tabs ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Пошук за номером, клієнтом, телефоном..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid var(--border, #d1d5db)',
            width: 340,
            maxWidth: '100%',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Всі (${orders.length})` },
            { id: 'pending_call', label: `📞 Очікують (${pendingCount})` },
            { id: 'called', label: `💬 Зв'язалися (${calledCount})` },
            { id: 'in_progress', label: `🧶 В роботі (${inProgressCount})` },
            { id: 'completed', label: `✓ Виконано (${completedCount})` },
            ...(cancelledCount > 0 ? [{ id: 'cancelled', label: `✕ Скасовано (${cancelledCount})` }] : []),
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
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders Table ── */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Клієнт</th>
              <th>Телефон</th>
              <th>Категорія / Виріб</th>
              <th>Статус</th>
              <th>Змінити статус</th>
              <th>Дата заявки</th>
              <th style={{ textAlign: 'right' }}>Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  Завантаження заявок...
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((item) => {
                const currentStatus = item.status === 'new' ? 'pending_call' : item.status;
                const itemId = item.id || item.order_number;
                return (
                  <tr
                    key={itemId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedOrder(item)}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--primary, #606c38)' }}>
                      {item.order_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
                      {item.customer_email && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.customer_email}</div>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${item.customer_phone?.replace(/\s+/g, '')}`}
                        style={{ color: 'var(--primary, #606c38)', fontWeight: 600, textDecoration: 'none' }}
                        title="Подзвонити клієнту"
                      >
                        {item.customer_phone} 📞
                      </a>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: '#374151' }}>
                        {item.category || 'Індивідуальне замовлення'}
                      </span>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={currentStatus}
                        disabled={updatingId === itemId}
                        onChange={(e) => handleStatusChange(itemId, e.target.value)}
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
                        <option value="cancelled">✕ Скасовано</option>
                      </select>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted, #777)' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(item)}
                          className="btn btn--ghost"
                          style={{ padding: '5px 10px', fontSize: 12, borderRadius: 8 }}
                          title="Переглянути деталі"
                        >
                          👁️ Деталі
                        </button>
                        <a
                          href={`tel:${item.customer_phone?.replace(/\s+/g, '')}`}
                          className="btn btn--ghost"
                          style={{ padding: '5px 10px', fontSize: 12, borderRadius: 8, textDecoration: 'none' }}
                          title="Подзвонити"
                        >
                          📞
                        </a>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteOrder(item)}
                          disabled={deletingId === itemId}
                          style={{
                            padding: '5px 9px',
                            fontSize: 12,
                            borderRadius: 8,
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          title="Видалити заявку"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  {search ? 'За вашим запитом заявок не знайдено' : 'Заявок на кастомні вироби поки немає'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              maxWidth: 540,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary, #606c38)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Кастомний виріб
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0 0', color: '#111827' }}>
                  Заявка #{selectedOrder.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Статус:</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Клієнт:</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedOrder.customer_name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Телефон:</span>
                <a
                  href={`tel:${selectedOrder.customer_phone?.replace(/\s+/g, '')}`}
                  style={{ color: 'var(--primary, #606c38)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
                >
                  {selectedOrder.customer_phone} 📞
                </a>
              </div>

              {selectedOrder.customer_email && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                  <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Email:</span>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{selectedOrder.customer_email}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Категорія:</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedOrder.category || 'Ручна робота'}</span>
              </div>

              {selectedOrder.budget && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                  <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Орієнтовний бюджет:</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedOrder.budget}</span>
                </div>
              )}

              {selectedOrder.deadline && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                  <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Бажаний термін:</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedOrder.deadline}</span>
                </div>
              )}

              {selectedOrder.description && (
                <div style={{ padding: '12px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                  <div style={{ color: 'var(--text-muted, #666)', fontSize: 13, marginBottom: 4 }}>Побажання клієнта:</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: '#111827', whiteSpace: 'pre-wrap' }}>
                    {selectedOrder.description}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-warm, #fdfbf7)', borderRadius: 10 }}>
                <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Дата створення:</span>
                <span style={{ fontSize: 13, color: '#374151' }}>
                  {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('uk-UA') : '—'}
                </span>
              </div>
            </div>

            {/* Change Status Buttons inside Modal */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#374151' }}>
                Швидка дія зі статусом:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => handleStatusChange(selectedOrder.id || selectedOrder.order_number, 'called')}
                  style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8 }}
                >
                  💬 Позначити: Зв'язалися
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => handleStatusChange(selectedOrder.id || selectedOrder.order_number, 'in_progress')}
                  style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8 }}
                >
                  🧶 В роботу
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => handleStatusChange(selectedOrder.id || selectedOrder.order_number, 'completed')}
                  style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8 }}
                >
                  ✓ Виконано
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteOrder(selectedOrder);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                🗑️ Видалити заявку
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={`tel:${selectedOrder.customer_phone?.replace(/\s+/g, '')}`}
                  className="btn btn--primary"
                  style={{ padding: '8px 18px', fontSize: 13, borderRadius: 8, textDecoration: 'none' }}
                >
                  📞 Зателефонувати
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirmation Modal ── */}
      {confirmDeleteOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            padding: 20,
          }}
          onClick={() => setConfirmDeleteOrder(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
              Видалити заявку на кастомний виріб?
            </h3>
            <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              Ви дійсно бажаєте видалити заявку <strong>#{confirmDeleteOrder.order_number}</strong> від клієнта <strong>{confirmDeleteOrder.customer_name}</strong> ({confirmDeleteOrder.customer_phone})?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteOrder(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteOrder)}
                disabled={deletingId === (confirmDeleteOrder.id || confirmDeleteOrder.order_number)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {deletingId === (confirmDeleteOrder.id || confirmDeleteOrder.order_number) ? 'Видалення...' : 'Видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
