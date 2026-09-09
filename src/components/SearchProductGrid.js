'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

export default function SearchProductGrid({ initialProducts = [], query = '' }) {
  const products = initialProducts;

  if (products.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty__icon">🔍</div>
        <h2 className="cart-empty__title">Нічого не знайдено</h2>
        <p className="cart-empty__text">
          За запитом «{query}» нічого не знайдено. Спробуйте змінити пошуковий запит.
        </p>
        <Link href="/shop" className="btn btn--primary">
          <span>Переглянути весь каталог</span>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, color: 'var(--text-muted)', fontSize: 14 }}>
        Знайдено {products.length} {products.length === 1 ? 'товар' : 'товарів'}
      </div>
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
