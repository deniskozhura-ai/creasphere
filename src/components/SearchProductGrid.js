'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

export default function SearchProductGrid({ initialProducts = [], query = '' }) {
  const [products, setProducts] = useState(initialProducts);

  useEffect(() => {
    try {
      const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_products') || '[]');
      if (Array.isArray(localCustom) && localCustom.length > 0 && query) {
        const qLower = query.toLowerCase();
        const matches = localCustom.filter(
          (p) =>
            p.name?.toLowerCase().includes(qLower) ||
            p.description?.toLowerCase().includes(qLower) ||
            p.brand?.toLowerCase().includes(qLower) ||
            p.category_name?.toLowerCase().includes(qLower) ||
            p.material?.toLowerCase().includes(qLower)
        );

        const existingIds = new Set(initialProducts.map((p) => p.id));
        const newToAdd = matches.filter((p) => !existingIds.has(p.id));

        if (newToAdd.length > 0) {
          setProducts([...newToAdd, ...initialProducts]);
          return;
        }
      }
      setProducts(initialProducts);
    } catch (e) {
      setProducts(initialProducts);
    }
  }, [initialProducts, query]);

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
