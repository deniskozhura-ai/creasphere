'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const inStock = product.status !== 'out_of_stock' && (product.stock > 0 || product.status === 'pre_order');
  const imageUrl = product.images?.[0] || product.image || null;
  const numPrice = Number(product.price || 0);
  const displayPrice = numPrice % 1 === 0 ? numPrice : numPrice.toFixed(2);

  return (
    <div className="product-card">
      <Link href={`/product/${product.slug || product.id}`} className="product-card__image">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="no-image">Немає фото</div>
        )}
        {!inStock ? (
          <span className="product-card__badge product-card__badge--out">Немає в наявності</span>
        ) : product.status === 'pre_order' ? (
          <span className="product-card__badge" style={{ background: '#d97706', color: '#fff' }}>Під замовлення</span>
        ) : null}
      </Link>
      <div className="product-card__body">
        {product.category_name && (
          <span className="product-card__category">{product.category_name}</span>
        )}
        <Link href={`/product/${product.slug || product.id}`}>
          <h3 className="product-card__name">{product.name}</h3>
        </Link>
        {product.sku && (
          <span className="product-card__sku">Артикул: {product.sku}</span>
        )}
        <div className="product-card__bottom">
          <span className="product-card__price">{displayPrice} ₴</span>
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
