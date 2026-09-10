'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function AdminBookingsTable({ initialBookings }) {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState(initialBookings || []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteBooking, setConfirmDeleteBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/workshops/book');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookings(data);
        }
      }
    } catch (e) {
      console.warn('Live bookings fetch error:', e);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/workshops/book', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b.booking_number === id ? { ...b, status: newStatus } : b))
        );
        try {
          const localBookings = JSON.parse(localStorage.getItem('creasphere_workshop_bookings') || '[]');
          const updatedLocal = localBookings.map((b) =>
            b.id === id || b.booking_number === id ? { ...b, status: newStatus } : b
          );
          localStorage.setItem('creasphere_workshop_bookings', JSON.stringify(updatedLocal));
        } catch (e) {}

        if (selectedBooking && (selectedBooking.id === id || selectedBooking.booking_number === id)) {
          setSelectedBooking((prev) => ({ ...prev, status: newStatus }));
        }
        showToast(`Статус змінено на «${getStatusLabel(newStatus)}»`, 'success');
      } else {
        showToast('Помилка оновлення статусу', 'error');
      }
    } catch (e) {
      showToast('Помилка з’єднання', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (b) => {
    if (!b) return;
    const id = b.id || b.booking_number;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/workshops/book?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setBookings((prev) => prev.filter((item) => item.id !== id && item.booking_number !== id));
        setConfirmDeleteBooking(null);
        try {
          const localBookings = JSON.parse(localStorage.getItem('creasphere_workshop_bookings') || '[]');
          const updatedLocal = localBookings.filter((item) => item.id !== id && item.booking_number !== id);
          localStorage.setItem('creasphere_workshop_bookings', JSON.stringify(updatedLocal));
        } catch (e) {}
        if (selectedBooking && (selectedBooking.id === id || selectedBooking.booking_number === id)) {
          setSelectedBooking(null);
        }
        showToast('Запис на майстер-клас успішно видалено', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Помилка видалення', 'error');
      }
    } catch (err) {
      showToast('Помилка видалення', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="admin-badge admin-badge--active">Підтверджено</span>;
      case 'completed':
        return <span className="admin-badge admin-badge--completed">Завершено</span>;
      case 'cancelled':
        return <span className="admin-badge" style={{ background: 'rgba(244, 67, 54, 0.1)', color: 'var(--error, #ef4444)' }}>Скасовано</span>;
      default:
        return <span className="admin-badge admin-badge--pending">Новий</span>;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Підтверджено';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Скасовано';
      default: return 'Новий';
    }
  };

  const filtered = bookings.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.booking_number?.toLowerCase().includes(q) ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.customer_phone?.toLowerCase().includes(q) ||
      b.workshop_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* ── Search & Filters ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Пошук за ім'ям, номером або назвою МК..."
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
            { key: 'all', label: `Всі (${bookings.length})` },
            { key: 'new', label: `🔔 Нові (${bookings.filter((b) => b.status === 'new').length})` },
            { key: 'confirmed', label: `✅ Підтверджені (${bookings.filter((b) => b.status === 'confirmed').length})` },
            { key: 'completed', label: `✓ Завершені (${bookings.filter((b) => b.status === 'completed').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-table__btn ${filterStatus === tab.key ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.key)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                borderRadius: 'var(--radius-sm)',
                fontWeight: filterStatus === tab.key ? 700 : 500,
                background: filterStatus === tab.key ? 'var(--primary, #606c38)' : '#fff',
                color: filterStatus === tab.key ? '#fff' : 'var(--text, #283618)',
                border: '1px solid var(--border, #d1d5db)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Клієнт</th>
              <th>Майстер-клас</th>
              <th>Учасників</th>
              <th>Бажана дата</th>
              <th>Статус</th>
              <th>Дата запису</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((b) => (
                <tr key={b.id || b.booking_number}>
                  <td style={{ fontWeight: 700, color: 'var(--primary, #606c38)' }}>{b.booking_number}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                    <a href={`tel:${b.customer_phone}`} style={{ fontSize: 13, color: 'var(--primary, #606c38)', textDecoration: 'none' }}>
                      {b.customer_phone}
                    </a>
                    {b.customer_email && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.customer_email}</div>
                    )}
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ fontWeight: 600 }}>{b.workshop_title}</div>
                    {b.notes && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-2, #6b7280)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 200,
                        }}
                      >
                        {b.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{b.participants_count} люд.</span>
                    {b.participant_age && b.participant_age !== 'Не вказано' && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Вік: {b.participant_age}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{b.preferred_date || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.preferred_time || ''}</div>
                  </td>
                  <td>{getStatusBadge(b.status)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {b.created_at?.slice(0, 16)}
                  </td>
                  <td>
                    <div className="admin-table__actions" style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="admin-table__btn"
                        onClick={() => setSelectedBooking(b)}
                        title="Детальніше"
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 8 }}
                      >
                        Деталі
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteBooking(b)}
                        disabled={deletingId === (b.id || b.booking_number)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          borderRadius: 8,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        title="Видалити запис"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Записів не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal for Booking Details ── */}
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
                  Запис на майстер-клас
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
              <div><strong>Клієнт:</strong> {selectedBooking.customer_name}</div>
              <div><strong>Телефон:</strong> <a href={`tel:${selectedBooking.customer_phone}`} style={{ color: 'var(--primary, #606c38)', fontWeight: 600 }}>{selectedBooking.customer_phone}</a></div>
              {selectedBooking.customer_email && (
                <div><strong>Email:</strong> {selectedBooking.customer_email}</div>
              )}
              <div><strong>Майстер-клас:</strong> {selectedBooking.workshop_title}</div>
              <div><strong>Кількість учасників:</strong> {selectedBooking.participants_count} люд.</div>
              {selectedBooking.participant_age && (
                <div><strong>Вік учасника(ів):</strong> {selectedBooking.participant_age}</div>
              )}
              <div><strong>Бажана дата:</strong> {selectedBooking.preferred_date} ({selectedBooking.preferred_time || 'Час узгоджується'})</div>
              {selectedBooking.notes && (
                <div style={{ background: '#fef3c7', padding: '8px 12px', borderRadius: 8, color: '#92400e' }}>
                  <strong>Коментар / побажання:</strong>
                  <p style={{ margin: '4px 0 0' }}>{selectedBooking.notes}</p>
                </div>
              )}
              <div><strong>Поточний статус:</strong> {getStatusBadge(selectedBooking.status)}</div>
              <div><strong>Дата створення:</strong> {selectedBooking.created_at}</div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteBooking(selectedBooking)}
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
                Видалити запис
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {selectedBooking.status !== 'confirmed' && (
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.booking_number, 'confirmed')}
                    style={{ padding: '8px 14px', fontSize: 13, borderRadius: 8 }}
                  >
                    <span>Підтвердити</span>
                  </button>
                )}
                {selectedBooking.status !== 'completed' && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.booking_number, 'completed')}
                    style={{ padding: '8px 14px', fontSize: 13, borderRadius: 8 }}
                  >
                    <span>Завершити</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirmation Modal ── */}
      {confirmDeleteBooking && (
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
          onClick={() => setConfirmDeleteBooking(null)}
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
              Видалити цей запис на майстер-клас?
            </h3>
            <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              Ви дійсно бажаєте безповоротно видалити запис <strong>#{confirmDeleteBooking.booking_number}</strong> від клієнта <strong>{confirmDeleteBooking.customer_name}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteBooking(null)}
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
                onClick={() => handleDelete(confirmDeleteBooking)}
                disabled={deletingId === (confirmDeleteBooking.id || confirmDeleteBooking.booking_number)}
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
                {deletingId === (confirmDeleteBooking.id || confirmDeleteBooking.booking_number) ? 'Видалення...' : 'Видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
