'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, isLoaded } = useCart();

  if (!isLoaded) {
    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Завантаження кошика...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main>
        <div className="page-header">
          <div className="container">
            <div className="page-header__breadcrumb">
              <Link href="/">Головна</Link>
              <span>/</span>
              <span>Кошик</span>
            </div>
            <h1 className="page-header__title">Кошик</h1>
          </div>
        </div>

        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty__icon">🛒</div>
            <h2 className="cart-empty__title">Ваш кошик порожній</h2>
            <p className="cart-empty__text">Виберіть товари в нашому каталозі, щоб додати їх до кошика.</p>
            <Link href="/shop" className="btn btn--primary">
              <span>До магазину</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <div className="page-header__breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <span>Кошик</span>
          </div>
          <h1 className="page-header__title">Кошик</h1>
        </div>
      </div>

      <div className="container">
        <div className="cart-page">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Ціна</th>
                <th>Кількість</th>
                <th>Разом</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="cart-item">
                      <div className="cart-item__img">
                        <img
                          src={item.image || '/hero_products.webp'}
                          alt={item.name}
                        />
                      </div>
                      <div>
                        <Link href={`/product/${item.slug || item.id}`} className="cart-item__name">
                          {item.name}
                        </Link>
                        {item.sku && <div className="cart-item__sku">АРТ: {item.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cart-item__price">{item.price} ₴</span>
                  </td>
                  <td>
                    <div className="quantity-selector">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Зменшити"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          updateQuantity(item.id, val);
                        }}
                        min="1"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Збільшити"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="cart-item__price" style={{ fontWeight: 700 }}>
                      {item.price * item.quantity} ₴
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="cart-item__remove"
                      onClick={() => removeItem(item.id)}
                      title="Видалити"
                      aria-label="Видалити"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-summary">
            <div className="cart-summary__row">
              <span>Кількість товарів</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
            </div>
            <div className="cart-summary__row">
              <span>Доставка</span>
              <span>За тарифами перевізника</span>
            </div>
            <div className="cart-summary__row cart-summary__row--total">
              <span>Загалом</span>
              <span>{totalPrice} ₴</span>
            </div>
            <Link
              href="/checkout"
              className="btn btn--primary"
              style={{ width: '100%', marginTop: 24, textAlign: 'center' }}
            >
              <span>Перейти до оформлення</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
