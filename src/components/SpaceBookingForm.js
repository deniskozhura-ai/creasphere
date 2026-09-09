'use client';

import { useState } from 'react';

export default function SpaceBookingForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('Дитяче свято / День народження');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('2');
  const [guests, setGuests] = useState('8');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError("Будь ласка, заповніть обов'язкові поля: ім'я та телефон");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/space-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          event_type: eventType,
          event_date: date,
          event_time: time,
          duration_hours: duration,
          guests_count: guests,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка при створенні заявки');

      setBookingResult(data.bookingNumber);
    } catch (err) {
      setError(err.message || 'Сталася помилка при відправці');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setDate('');
    setTime('');
    setNotes('');
    setBookingResult(null);
  };

  if (bookingResult) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '48px 36px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)',
          textAlign: 'center',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            margin: '0 auto 20px auto',
          }}
        >
          ✓
        </div>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
          Бронювання прийнято!
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
          Номер вашої заявки: <strong>{bookingResult}</strong>
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text)', marginBottom: 28 }}>
          Дякуємо, <strong>{name}</strong>! Адміністратор простору CreaSphere зв'яжеться з вами за номером <strong>{phone}</strong>, щоб підтвердити час оренди та узгодити всі деталі вашого заходу.
        </p>
        <button
          onClick={handleReset}
          className="btn btn--primary"
          style={{ padding: '14px 32px', borderRadius: 12 }}
        >
          Забронювати ще одну дату
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 24,
        padding: '40px 36px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--sage, #606c38)',
            background: 'rgba(96, 108, 56, 0.12)',
            padding: '4px 12px',
            borderRadius: 20,
            display: 'inline-block',
            marginBottom: 10,
          }}
        >
          Онлайн-заявка
        </span>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px 0' }}>
          Забронювати простір CreaSphere
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
          Заповніть інформацію, і ми передзвонимо вам протягом 15 хвилин для підтвердження.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Ваше ім'я та прізвище *
          </label>
          <input
            type="text"
            required
            placeholder="Наталія Шевченко"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #d1d5db)',
              fontSize: 14,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Номер телефону *
          </label>
          <input
            type="tel"
            required
            placeholder="+380 50 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #d1d5db)',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Формат заходу / Тип події
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #d1d5db)',
              fontSize: 14,
              background: '#fff',
            }}
          >
            <option value="Дитяче свято / День народження">🎂 Дитяче свято / День народження</option>
            <option value="Власний майстер-клас">🎨 Власний майстер-клас (для майстрів)</option>
            <option value="Зустріч / Лекція / Презентація">💼 Зустріч / Лекція / Презентація</option>
            <option value="Коворкінг / Творча оренда">💻 Коворкінг / Творча робота</option>
            <option value="Фотосесія">📸 Фотосесія у просторі</option>
            <option value="Корпоративний захід">🎉 Корпоративний захід</option>
            <option value="Інше">✨ Інший формат</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Бажана дата
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #d1d5db)',
              fontSize: 14,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Час початку
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #d1d5db)',
              fontSize: 14,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Орієнтовна тривалість (годин)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #d1d5db)',
              fontSize: 14,
              background: '#fff',
            }}
          >
            <option value="1">1 година</option>
            <option value="2">2 години (рекомендовано)</option>
            <option value="3">3 години</option>
            <option value="4">4 години</option>
            <option value="5">5+ годин / цілий день</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Кількість гостей / учасників
          </label>
          <input
            type="number"
            min="1"
            max="35"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #d1d5db)',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Додаткові побажання (обладнання, чай/кава, розстановка столів)
          </label>
          <textarea
            rows={3}
            placeholder="Наприклад: потрібен проектор для показу фото, чайник та посуд для солодощів..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--border, #d1d5db)',
              fontSize: 14,
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary magnetic"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Надсилаємо заявку...' : 'Забронювати простір онлайн 🏛️'}
          </button>
        </div>
      </form>
    </div>
  );
}
