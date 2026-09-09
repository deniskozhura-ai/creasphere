'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const inStock = product.stock > 0;
  const imageUrl = product.images?.[0] || null;

  return (
    <div className="product-card">
      <Link href={`/product/${product.slug}`} className="product-card__image">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="no-image">Немає фото</div>
        )}
        {!inStock && (
          <span className="product-card__badge product-card__badge--out">Немає в наявності</span>
        )}
      </Link>
      <div className="product-card__body">
        {product.category_name && (
          <span className="product-card__category">{product.category_name}</span>
        )}
        <Link href={`/product/${product.slug}`}>
          <h3 className="product-card__name">{product.name}</h3>
        </Link>
        {product.sku && (
          <span className="product-card__sku">Артикул: {product.sku}</span>
        )}
        <div className="product-card__bottom">
          <span className="product-card__price">{product.price.toFixed(2)} ₴</span>
          <button
            className="product-card__add-btn"
            onClick={(e) => {
              e.preventDefault();
              if (inStock) addItem(product);
            }}
            disabled={!inStock}
            aria-label="Додати в кошик"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
