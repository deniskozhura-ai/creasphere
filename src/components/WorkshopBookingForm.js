'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function WorkshopBookingForm({
  initialWorkshop = '',
  workshopTypes = [],
  onBookingSuccess,
}) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    workshop: initialWorkshop || 'Гончарство та кераміка',
    participants: 1,
    participantAge: '',
    scheduledDate: '',
    date: '',
    time: '14:00',
    notes: '',
  });

  useEffect(() => {
    if (initialWorkshop) {
      setFormData((prev) => ({ ...prev, workshop: initialWorkshop }));
    } else if (Array.isArray(workshopTypes) && workshopTypes.length > 0) {
      setFormData((prev) => {
        if (!prev.workshop || !workshopTypes.some((w) => w.title === prev.workshop)) {
          return { ...prev, workshop: workshopTypes[0].title };
        }
        return prev;
      });
    }
  }, [initialWorkshop, workshopTypes]);

  const currentWorkshopObj = workshopTypes?.find((w) => w.title === formData.workshop);
  const availableDates = currentWorkshopObj?.scheduled_dates || [];

  const workshopsList = Array.isArray(workshopTypes) && workshopTypes.length > 0
    ? [...workshopTypes.map((w) => w.title), 'Індивідуальний майстер-клас']
    : [
        'Гончарство та кераміка',
        'Мозаїка та вітражний арт',
        'Ароматичні соєві свічки',
        'Живопис та текстурний арт',
        'Дитячі свята та дні народження',
        'Корпоративи та тімбілдинги',
        'Індивідуальний майстер-клас',
      ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast("Будь ласка, вкажіть ваше ім'я та контактний телефон", 'error');
      return;
    }

    setLoading(true);

    const finalDate = formData.scheduledDate && formData.scheduledDate !== 'custom'
      ? formData.scheduledDate
      : (formData.date ? `${formData.date} ${formData.time}` : 'За домовленістю');

    try {
      const res = await fetch('/api/workshops/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email,
          workshop_title: formData.workshop,
          participants_count: formData.participants,
          participant_age: formData.participantAge,
          preferred_date: finalDate,
          preferred_time: formData.time || '14:00',
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.booking) {
          try {
            const prev = JSON.parse(localStorage.getItem('creasphere_workshop_bookings') || '[]');
            localStorage.setItem(
              'creasphere_workshop_bookings',
              JSON.stringify([data.booking, ...prev.filter((b) => b.id !== data.booking.id)])
            );
          } catch (e) {}
        }
        setSubmittedBooking({
          number: data.bookingNumber,
          name: formData.name,
          workshop: formData.workshop,
          participants: formData.participants,
          phone: formData.phone,
          date: finalDate,
        });
        showToast('Запис на майстер-клас успішно створено!', 'success');
        if (onBookingSuccess) onBookingSuccess(data);
      } else {
        showToast(data.error || 'Помилка при створенні запису', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Не вдалося надіслати форму. Спробуйте пізніше.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submittedBooking) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(32px, 5vw, 48px)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(76, 175, 80, 0.1)',
            color: 'var(--success, #059669)',
            fontSize: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          ✓
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 12 }}>
          Запис успішно оформлено!
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>
          Номер вашого запису: <strong style={{ color: 'var(--text)' }}>{submittedBooking.number}</strong>
        </p>

        <div
          style={{
            background: 'var(--bg-warm, #f8f6f0)',
            padding: 20,
            borderRadius: 'var(--radius-sm)',
            textAlign: 'left',
            fontSize: 14,
            lineHeight: 1.8,
            marginBottom: 28,
            border: '1px solid var(--border)',
          }}
        >
          <div><strong>Клієнт:</strong> {submittedBooking.name}</div>
          <div><strong>Телефон:</strong> {submittedBooking.phone}</div>
          <div><strong>Майстер-клас:</strong> {submittedBooking.workshop}</div>
          <div><strong>Учасників:</strong> {submittedBooking.participants} люд.</div>
          <div><strong>Обрана дата:</strong> {submittedBooking.date}</div>
        </div>

        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>
          Ми вже отримали ваш запис у системі адміністратора та зв'яжемося з вами для остаточного підтвердження.
        </p>

        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setSubmittedBooking(null);
            setFormData({
              name: '',
              phone: '',
              email: '',
              workshop: 'Гончарство та кераміка',
              participants: 1,
              participantAge: '',
              scheduledDate: '',
              date: '',
              time: '14:00',
              notes: '',
            });
          }}
        >
          <span>Записатися на інший майстер-клас</span>
        </button>
      </div>
    );
  }

  return (
    <form
      id="book-form"
      onSubmit={handleSubmit}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 'clamp(32px, 5vw, 48px)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border)',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 28px)', marginBottom: 8 }}>
          Онлайн-запис на майстер-клас
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Заповніть коротку форму, і ми зв'яжемося з вами для підтвердження
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Ваше ім'я <span className="required">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Олена Ковальчук"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">
            Номер телефону <span className="required">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="+380 99 123 4567"
            className="form-input"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="workshop">
            Оберіть майстер-клас <span className="required">*</span>
          </label>
          <select
            id="workshop"
            name="workshop"
            className="form-select"
            value={formData.workshop}
            onChange={handleChange}
          >
            {workshopsList.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="participantAge">
            Вік учасника(ів) або дитини
          </label>
          <input
            id="participantAge"
            name="participantAge"
            type="text"
            placeholder="Наприклад: 8 років або дорослий"
            className="form-input"
            value={formData.participantAge}
            onChange={handleChange}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="participants">
            Кількість учасників
          </label>
          <select
            id="participants"
            name="participants"
            className="form-select"
            value={formData.participants}
            onChange={handleChange}
          >
            {[1, 2, 3, 4, 5, 6, '7+'].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'учасник' : num < 5 ? 'учасники' : 'учасників'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="scheduledDate">
            Запланована дата (з розкладу)
          </label>
          <select
            id="scheduledDate"
            name="scheduledDate"
            className="form-select"
            value={formData.scheduledDate}
            onChange={handleChange}
          >
            <option value="">Оберіть дату або вкажіть свою нижче</option>
            {availableDates.map((d, idx) => (
              <option key={idx} value={d}>
                📅 {d}
              </option>
            ))}
            <option value="custom">✍️ Інша дата (вказати вручну)</option>
          </select>
        </div>
      </div>

      {(!formData.scheduledDate || formData.scheduledDate === 'custom') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="date">
              Бажана дата
            </label>
            <input
              id="date"
              name="date"
              type="date"
              className="form-input"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="time">
              Зручний час
            </label>
            <select
              id="time"
              name="time"
              className="form-select"
              value={formData.time}
              onChange={handleChange}
            >
              <option value="11:00">11:00 (ранкова група)</option>
              <option value="14:00">14:00 (день)</option>
              <option value="16:30">16:30 (після обіду)</option>
              <option value="18:00">18:00 (вечірня група)</option>
            </select>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="notes">
          Побажання чи запитання
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Наприклад: хочемо виліпити парні горнятка або чи є подарунковий сертифікат..."
          className="form-textarea"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn--primary"
        style={{
          width: '100%',
          marginTop: 12,
          padding: '16px',
          fontSize: 16,
          fontWeight: 600,
          justifyContent: 'center',
        }}
      >
        <span>{loading ? 'Оформлюємо запис...' : 'Підтвердити запис на майстер-клас'}</span>
      </button>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 14 }}>
        🔒 Ми не передаємо ваші дані третім особам. Оплата здійснюється на місці перед початком заняття.
      </p>
    </form>
  );
}
