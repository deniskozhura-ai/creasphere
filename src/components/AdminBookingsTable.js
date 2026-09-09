'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function AdminBookingsTable({ initialBookings }) {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState(initialBookings);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="admin-badge admin-badge--active">Підтверджено</span>;
      case 'completed':
        return <span className="admin-badge admin-badge--completed">Завершено</span>;
      case 'cancelled':
        return <span className="admin-badge" style={{ background: 'rgba(244, 67, 54, 0.1)', color: 'var(--error)' }}>Скасовано</span>;
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

  const filtered = filterStatus === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  return (
    <div>
      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `Всі (${bookings.length})` },
          { key: 'new', label: `Нові (${bookings.filter((b) => b.status === 'new').length})` },
          { key: 'confirmed', label: `Підтверджені (${bookings.filter((b) => b.status === 'confirmed').length})` },
          { key: 'completed', label: `Завершені (${bookings.filter((b) => b.status === 'completed').length})` },
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
              fontWeight: filterStatus === tab.key ? 600 : 400,
              background: filterStatus === tab.key ? 'var(--text)' : 'var(--bg)',
              color: filterStatus === tab.key ? 'var(--text-light)' : 'var(--text)',
              borderColor: filterStatus === tab.key ? 'var(--text)' : 'var(--border-2)',
            }}
          >
            {tab.label}
          </button>
        ))}
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
                  <td style={{ fontWeight: 600 }}>{b.booking_number}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.customer_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.customer_phone}</div>
                    {b.customer_email && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.customer_email}</div>
                    )}
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ fontWeight: 500 }}>{b.workshop_title}</div>
                    {b.notes && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-2)',
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
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{b.preferred_date || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.preferred_time || ''}</div>
                  </td>
                  <td>{getStatusBadge(b.status)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {b.created_at?.slice(0, 16)}
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__btn"
                        onClick={() => setSelectedBooking(b)}
                        title="Детальніше"
                      >
                        Деталі
                      </button>
                      {b.status === 'new' && (
                        <button
                          type="button"
                          className="admin-table__btn"
                          style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                          disabled={loadingId === b.id}
                          onClick={() => handleStatusChange(b.id || b.booking_number, 'confirmed')}
                        >
                          Підтвердити
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          type="button"
                          className="admin-table__btn"
                          style={{ color: 'var(--text)', borderColor: 'var(--text)' }}
                          disabled={loadingId === b.id}
                          onClick={() => handleStatusChange(b.id || b.booking_number, 'completed')}
                        >
                          Завершити
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Записів з таким статусом не знайдено
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
            background: 'rgba(0,0,0,0.5)',
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
              background: 'var(--bg)',
              borderRadius: 'var(--radius-lg)',
              padding: 32,
              maxWidth: 520,
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
                Запис #{selectedBooking.booking_number}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              <div><strong>Клієнт:</strong> {selectedBooking.customer_name}</div>
              <div><strong>Телефон:</strong> <a href={`tel:${selectedBooking.customer_phone}`} style={{ color: 'var(--text)', textDecoration: 'underline' }}>{selectedBooking.customer_phone}</a></div>
              {selectedBooking.customer_email && (
                <div><strong>Email:</strong> {selectedBooking.customer_email}</div>
              )}
              <div><strong>Майстер-клас:</strong> {selectedBooking.workshop_title}</div>
              <div><strong>Кількість учасників:</strong> {selectedBooking.participants_count} люд.</div>
              {selectedBooking.participant_age && (
                <div><strong>Вік учасника(ів):</strong> {selectedBooking.participant_age}</div>
              )}
              <div><strong>Бажана дата:</strong> {selectedBooking.preferred_date}</div>
              <div><strong>Бажаний час:</strong> {selectedBooking.preferred_time}</div>
              {selectedBooking.notes && (
                <div style={{ background: 'var(--bg-cream)', padding: 12, borderRadius: 6 }}>
                  <strong>Коментар / побажання:</strong>
                  <p style={{ marginTop: 4, color: 'var(--text-2)' }}>{selectedBooking.notes}</p>
                </div>
              )}
              <div><strong>Поточний статус:</strong> {getStatusBadge(selectedBooking.status)}</div>
              <div><strong>Дата створення:</strong> {selectedBooking.created_at}</div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {selectedBooking.status !== 'confirmed' && (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.booking_number, 'confirmed')}
                >
                  <span>Підтвердити</span>
                </button>
              )}
              {selectedBooking.status !== 'completed' && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.booking_number, 'completed')}
                >
                  <span>Завершити</span>
                </button>
              )}
              {selectedBooking.status !== 'cancelled' && (
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.booking_number, 'cancelled')}
                >
                  <span>Скасувати</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
