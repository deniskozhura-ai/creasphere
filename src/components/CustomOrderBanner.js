'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const CustomOrderModal = dynamic(() => import('./CustomOrderModal'), { ssr: false });

export default function CustomOrderBanner() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        style={{
          background: 'linear-gradient(135deg, #fdfbf7 0%, #f4eee3 100%)',
          border: '1px solid rgba(193, 154, 107, 0.35)',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>🧶</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--sage, #606c38)',
                background: 'rgba(96, 108, 56, 0.12)',
                padding: '3px 10px',
                borderRadius: 20,
              }}
            >
              Ручна робота під замовлення
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text, #283618)' }}>
            Хочете щось особливе або кастомне?
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted, #666)', lineHeight: 1.5 }}>
            Якщо ви шукаєте індивідуальний подарунок, інший колір або персональний напис — залиште контакти, і майстер зв'яжеться з вами телефоном!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn btn--primary"
          style={{
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 12,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(40, 54, 24, 0.15)',
          }}
        >
          <span>Хочу кастомний виріб 📞</span>
        </button>
      </div>

      {modalOpen && <CustomOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </>
  );
}
