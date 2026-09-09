'use client';

import { useState } from 'react';

export default function AdminSpaceTable({ initialBookings }) {
  const [bookings, setBookings] = useState(initialBookings || []);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

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
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
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

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border, #e5e7eb)', paddingBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Всі бронювання', count: bookings.length },
          { id: 'new', label: 'Нові', count: bookings.filter((b) => b.status === 'new').length },
          { id: 'confirmed', label: 'Підтверджені', count: bookings.filter((b) => b.status === 'confirmed').length },
          { id: 'completed', label: 'Проведені', count: bookings.filter((b) => b.status === 'completed').length },
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
              <th>Клієнт / Телефон</th>
              <th>Подія</th>
              <th>Дата та час</th>
              <th>Гості / Тривалість</th>
              <th>Статус</th>
              <th>Змінити статус</th>
              <th>Примітки</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.booking_number}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
                    <a
                      href={`tel:${item.customer_phone.replace(/\s+/g, '')}`}
                      style={{ color: 'var(--sage, #606c38)', fontSize: 13, textDecoration: 'none' }}
                    >
                      {item.customer_phone} 📞
                    </a>
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: 180 }}>{item.event_type}</td>
                  <td>
                    <div><strong>{item.event_date}</strong></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>початок о {item.event_time}</div>
                  </td>
                  <td>
                    <div>👥 {item.guests_count} гостей</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏳ {item.duration_hours} год</div>
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
                      <option value="new">Нова заявка</option>
                      <option value="confirmed">Підтверджено</option>
                      <option value="completed">Проведено</option>
                      <option value="cancelled">Скасовано</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 220 }}>
                    {item.notes || '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
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
