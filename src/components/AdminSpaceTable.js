'use client';

import { useState, useEffect } from 'react';

export default function AdminSpaceTable() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Confirmation modal state (replaces native confirm())
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/space-bookings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Normalize field names: Supabase uses date/time/people_count,
          // but the UI expects event_date/event_time/guests_count
          const normalized = data.map((b) => ({
            ...b,
            event_date: b.event_date || b.date || '',
            event_time: b.event_time || b.time || '',
            guests_count: b.guests_count || b.people_count || 0,
            duration_hours: b.duration_hours || '',
            event_type: b.event_type || b.tariff || '',
          }));
          setBookings(normalized);
        }
      }
    } catch (err) {
      console.error('Failed to fetch space bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch live data from Supabase via API on mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/space-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b.booking_number === id ? { ...b, status: newStatus } : b))
        );

        if (selectedBooking && (selectedBooking.id === id || selectedBooking.booking_number === id)) {
          setSelectedBooking((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteConfirm = (id) => {
    setConfirmModal({ open: true, id });
  };

  const handleDelete = async (id) => {
    setConfirmModal({ open: false, id: null });
    setDeletingId(id);
    try {
      const res = await fetch(`/api/space-bookings?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id && b.booking_number !== id));
        if (selectedBooking && (selectedBooking.id === id || selectedBooking.booking_number === id)) {
          setSelectedBooking(null);
        }
      }
    } catch (err) {
      console.error('Delete space booking failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.booking_number?.toLowerCase().includes(q) ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.customer_phone?.toLowerCase().includes(q) ||
      b.event_type?.toLowerCase().includes(q) ||
      b.tariff?.toLowerCase().includes(q) ||
      b.notes?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
            🆕 Нова заявка
          </span>
        );
      case 'confirmed':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#ecfdf5', color: '#047857' }}>
            ✅ Підтверджено
          </span>
        );
      case 'completed':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#f3f4f6', color: '#374151' }}>
            🎉 Проведено
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
            ❌ Скасовано
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
        Завантаження заявок...
      </div>
    );
  }

  return (
    <div>
      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 20,
          }}
          onClick={() => setConfirmModal({ open: false, id: null })}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Видалити заявку?</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
              Цю дію неможливо скасувати. Заявка буде видалена назавжди.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, id: null })}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmModal.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Так, видалити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Пошук за ім'ям, телефоном або подією..."
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
            { id: 'all', label: `Всі (${bookings.length})` },
            { id: 'new', label: `🆕 Нові (${bookings.filter((b) => b.status === 'new').length})` },
            { id: 'confirmed', label: `✅ Підтверджені (${bookings.filter((b) => b.status === 'confirmed').length})` },
            { id: 'completed', label: `🎉 Проведені (${bookings.filter((b) => b.status === 'completed').length})` },
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
              <th>Клієнт / Телефон</th>
              <th>Тип події</th>
              <th>Дата та час</th>
              <th>Гості / Час</th>
              <th>Статус</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((item) => (
                <tr key={item.id || item.booking_number}>
                  <td style={{ fontWeight: 700, color: 'var(--primary, #606c38)' }}>{item.booking_number}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
                    <a
                      href={`tel:${item.customer_phone?.replace(/\s+/g, '')}`}
                      style={{ color: 'var(--primary, #606c38)', fontSize: 13, textDecoration: 'none' }}
                    >
                      {item.customer_phone} 📞
                    </a>
                  </td>
                  <td style={{ fontWeight: 600, maxWidth: 200 }}>
                    <div>{item.event_type || item.tariff}</div>
                    {item.notes && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {item.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <div><strong>{item.event_date}</strong></div>
                    {item.event_time && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>о {item.event_time}</div>
                    )}
                  </td>
                  <td>
                    <div>👥 {item.guests_count} гостей</div>
                    {item.duration_hours && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏳ {item.duration_hours} год</div>
                    )}
                  </td>
                  <td>
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id || item.booking_number, e.target.value)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        border: '1px solid var(--border, #ccc)',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="new">🆕 Нова заявка</option>
                      <option value="confirmed">✅ Підтверджено</option>
                      <option value="completed">🎉 Проведено</option>
                      <option value="cancelled">❌ Скасовано</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(item)}
                        className="btn btn--ghost"
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 8 }}
                      >
                        Деталі
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConfirm(item.id || item.booking_number)}
                        disabled={deletingId === (item.id || item.booking_number)}
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

      {/* Details Modal */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 28,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f0f0f0', paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                  Бронювання простору
                </span>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0', color: 'var(--primary, #606c38)' }}>
                  #{selectedBooking.booking_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, lineHeight: 1.6, marginBottom: 24, background: '#f9fafb', padding: 16, borderRadius: 12 }}>
              <div><strong>Замовник:</strong> {selectedBooking.customer_name}</div>
              <div><strong>Телефон:</strong> <a href={`tel:${selectedBooking.customer_phone}`} style={{ color: 'var(--primary, #606c38)', fontWeight: 600 }}>{selectedBooking.customer_phone}</a></div>
              <div><strong>Тип події:</strong> {selectedBooking.event_type || selectedBooking.tariff}</div>
              <div><strong>Дата та час:</strong> {selectedBooking.event_date} о {selectedBooking.event_time}</div>
              {selectedBooking.duration_hours && (
                <div><strong>Тривалість:</strong> {selectedBooking.duration_hours} години</div>
              )}
              <div><strong>Кількість гостей:</strong> {selectedBooking.guests_count} осіб</div>
              {selectedBooking.notes && (
                <div style={{ background: '#fef3c7', padding: '8px 12px', borderRadius: 8, color: '#92400e' }}>
                  <strong>Примітки / побажання:</strong>
                  <p style={{ margin: '4px 0 0' }}>{selectedBooking.notes}</p>
                </div>
              )}
              <div><strong>Статус:</strong> {getStatusBadge(selectedBooking.status)}</div>
              <div><strong>Дата створення:</strong> {selectedBooking.created_at}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(selectedBooking.id || selectedBooking.booking_number)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Видалити заявку
              </button>

              <select
                value={selectedBooking.status}
                onChange={(e) => {
                  handleStatusChange(selectedBooking.id || selectedBooking.booking_number, e.target.value);
                  setSelectedBooking((prev) => ({ ...prev, status: e.target.value }));
                }}
                style={{ padding: '8px 12px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}
              >
                <option value="new">🆕 Нова заявка</option>
                <option value="confirmed">✅ Підтверджено</option>
                <option value="completed">🎉 Проведено</option>
                <option value="cancelled">❌ Скасовано</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
