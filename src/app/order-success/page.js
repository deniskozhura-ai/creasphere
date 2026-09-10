'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'CS-XXXXXX';

  return (
    <div className="order-success">
      <div className="order-success__icon">✓</div>
      <h1 className="order-success__title">Дякуємо за замовлення!</h1>
      <p className="order-success__number">Номер замовлення: <strong>{orderNumber}</strong></p>
      <p style={{ maxWidth: 500, margin: '0 auto 36px', color: 'var(--text-2)', lineHeight: 1.6 }}>
        Ми отримали ваше замовлення! Наш менеджер незабаром зателефонує вам для уточнення деталей замовлення та надішле реквізити для оплати.
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/shop" className="btn btn--primary">
          <span>Продовжити покупки</span>
        </Link>
        <Link href="/" className="btn btn--ghost">
          <span>На головну</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main>
      <div className="container">
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0' }}>Завантаження...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </div>
    </main>
  );
}
