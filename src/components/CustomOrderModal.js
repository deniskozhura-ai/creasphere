'use client';

import { useState } from 'react';

export default function CustomOrderModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedNumber, setSubmittedNumber] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError("Будь ласка, заповніть ім'я та телефон");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка');

      setSubmittedNumber(data.orderNumber);
    } catch (err) {
      setError(err.message || 'Сталася помилка при відправці');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setError('');
    setSubmittedNumber(null);
    onClose();
  };

  return (
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
      onClick={handleReset}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 20,
          maxWidth: 480,
          width: '100%',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          position: 'relative',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleReset}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: 'var(--text-muted, #777)',
            padding: 4,
          }}
          aria-label="Закрити"
        >
          ✕
        </button>

        {!submittedNumber ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 40, display: 'inline-block', marginBottom: 8 }}>✨</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text, #1c1c1c)' }}>
                Індивідуальне замовлення
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted, #666)', lineHeight: 1.5, margin: 0 }}>
                Хочете особливий подарунок або виріб за власним задумом? Залиште контакти, і майстер зателефонує вам, щоб узгодити всі деталі!
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text, #333)' }}>
                  Ваше ім'я та прізвище *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Олена Коваль"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border, #d1d5db)',
                    fontSize: 15,
                    outline: 'none',
                    background: 'var(--bg-input, #fff)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text, #333)' }}>
                  Номер телефону *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+380 99 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border, #d1d5db)',
                    fontSize: 15,
                    outline: 'none',
                    background: 'var(--bg-input, #fff)',
                  }}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: 12,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? 'Надсилаємо...' : 'Замовити дзвінок майстра 📞'}
                </button>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted, #888)', textAlign: 'center', margin: 0 }}>
                🔒 Ми не передаємо ваші дані третім особам
              </p>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                margin: '0 auto 16px auto',
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, color: 'var(--text, #1c1c1c)' }}>
              Заявку прийнято!
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #666)', marginBottom: 12 }}>
              Номер вашого запиту: <strong>{submittedNumber}</strong>
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text, #333)', marginBottom: 24 }}>
              Дякуємо, <strong>{name}</strong>! Майстер невдовзі зателефонує вам за номером <strong>{phone}</strong>, і ви разом обговорите всі побажання щодо індивідуального виробу.
            </p>
            <button
              onClick={handleReset}
              className="btn btn--primary"
              style={{ padding: '12px 28px', borderRadius: 12 }}
            >
              Чудово, дякую!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
