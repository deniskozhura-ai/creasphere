'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useToast } from '@/components/Toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, isLoaded } = useCart();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    deliveryMethod: 'nova_poshta',
    warehouse: '',
    paymentMethod: 'card',
    comment: '',
  });

  if (!isLoaded) {
    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main>
        <div className="page-header">
          <div className="container">
            <h1 className="page-header__title">Оформлення замовлення</h1>
          </div>
        </div>
        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty__icon">🛒</div>
            <h2 className="cart-empty__title">Ваш кошик порожній</h2>
            <p className="cart-empty__text">Для оформлення замовлення додайте товари до кошика.</p>
            <Link href="/shop" className="btn btn--primary">
              <span>До каталогу</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast("Будь ласка, вкажіть ваше ім'я та телефон", 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email,
          delivery_city: formData.city,
          delivery_address: formData.warehouse,
          delivery_method: formData.deliveryMethod,
          payment_method: formData.paymentMethod,
          notes: formData.comment,
          items: items.map((item) => ({
            productId: item.id || item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        clearCart();
        showToast('Замовлення оформлено!', 'success');
        router.push(`/order-success?order=${data.orderNumber}`);
      } else {
        showToast(data.error || 'Помилка оформлення', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка надсилання замовлення', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <div className="page-header__breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <Link href="/cart">Кошик</Link>
            <span>/</span>
            <span>Оформлення замовлення</span>
          </div>
          <h1 className="page-header__title">Оформлення замовлення</h1>
        </div>
      </div>

      <div className="container">
        <div className="checkout-page">
          <form onSubmit={handleSubmit} className="checkout-grid">
            <div className="checkout-form">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 24 }}>
                1. Контактні дані
              </h2>

              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Ім'я та Прізвище <span className="required">*</span>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Телефон <span className="required">*</span>
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
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: '40px 0 24px' }}>
                2. Доставка
              </h2>

              <div className="form-group">
                <label className="form-label" htmlFor="deliveryMethod">
                  Спосіб доставки
                </label>
                <select
                  id="deliveryMethod"
                  name="deliveryMethod"
                  className="form-select"
                  value={formData.deliveryMethod}
                  onChange={handleChange}
                >
                  <option value="nova_poshta">Нова Пошта (відділення або поштомат)</option>
                  <option value="ukrposhta">Укрпошта</option>
                  <option value="pickup">Самовивіз (м. Павлоград, вул. Шевченка, 138б)</option>
                </select>
              </div>

              {formData.deliveryMethod !== 'pickup' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="city">
                      Місто / Населений пункт
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Київ / Павлоград"
                      className="form-input"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="warehouse">
                      Номер відділення або поштомату
                    </label>
                    <input
                      id="warehouse"
                      name="warehouse"
                      type="text"
                      placeholder="Відділення № 5"
                      className="form-input"
                      value={formData.warehouse}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: '40px 0 24px' }}>
                3. Оплата та примітки
              </h2>

              <div className="form-group">
                <label className="form-label" htmlFor="paymentMethod">
                  Спосіб оплати
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  className="form-select"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="card">Онлайн-оплата (карткою Visa / Mastercard)</option>
                  <option value="cod">Післяплата при отриманні (накладений платіж)</option>
                  <option value="cash">Готівкою при самовивозі</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="comment">
                  Коментар до замовлення
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  rows="3"
                  placeholder="Додаткові побажання, святкова упаковка, листівка тощо"
                  className="form-textarea"
                  value={formData.comment}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Sidebar Order Summary */}
            <div className="cart-summary" style={{ margin: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 20 }}>
                Ваше замовлення
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name} × {item.quantity}
                    </span>
                    <span style={{ fontWeight: 600 }}>{item.price * item.quantity} ₴</span>
                  </div>
                ))}
              </div>

              <div className="cart-summary__row">
                <span>Доставка</span>
                <span>За тарифами перевізника</span>
              </div>
              <div className="cart-summary__row cart-summary__row--total">
                <span>До сплати</span>
                <span>{totalPrice} ₴</span>
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
                style={{ width: '100%', marginTop: 24 }}
              >
                <span>{loading ? 'Оформлення...' : 'Підтвердити замовлення'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
