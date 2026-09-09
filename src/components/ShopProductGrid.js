'use client';

import Link from 'next/link';
import ProductCard from './ProductCard';

export default function ShopProductGrid({
  initialProducts = [],
}) {
  if (!initialProducts || initialProducts.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty__icon">🔍</div>
        <h2 className="cart-empty__title">Товарів не знайдено</h2>
        <p className="cart-empty__text">Спробуйте змінити фільтри або переглянути інші категорії</p>
        <Link href="/shop" className="btn btn--primary">
          <span>Переглянути всі товари</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {initialProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
