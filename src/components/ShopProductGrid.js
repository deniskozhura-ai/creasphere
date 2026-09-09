'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

export default function ShopProductGrid({
  initialProducts = [],
  currentCategory = '',
  currentBrand = '',
  minPrice = null,
  maxPrice = null,
  inStock = false,
}) {
  const [products, setProducts] = useState(initialProducts);

  useEffect(() => {
    try {
      const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_products') || '[]');
      if (Array.isArray(localCustom) && localCustom.length > 0) {
        const catMap = {
          'handmade-gifts': '1',
          'souvenirs-decor': '2',
          'craft-kits': '3',
          'toys': '4',
        };

        const filterProduct = (p) => {
          if (currentCategory) {
            const targetId = catMap[currentCategory] || currentCategory;
            if (String(p.category_id) !== String(targetId) && p.category_slug !== currentCategory) {
              return false;
            }
          }
          if (currentBrand && p.brand?.toLowerCase() !== currentBrand.toLowerCase()) {
            return false;
          }
          if (minPrice !== null && p.price < minPrice) return false;
          if (maxPrice !== null && p.price > maxPrice) return false;
          if (inStock && p.status === 'out_of_stock') return false;
          return true;
        };

        const matchingLocal = localCustom.filter(filterProduct);
        const existingIds = new Set(initialProducts.map((p) => p.id));
        const newToAdd = matchingLocal.filter((p) => !existingIds.has(p.id));

        if (newToAdd.length > 0) {
          setProducts([...newToAdd, ...initialProducts]);
          return;
        }
      }
      setProducts(initialProducts);
    } catch (e) {
      console.warn('LocalStorage products read error:', e);
      setProducts(initialProducts);
    }
  }, [initialProducts, currentCategory, currentBrand, minPrice, maxPrice, inStock]);

  if (!products || products.length === 0) {
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
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
