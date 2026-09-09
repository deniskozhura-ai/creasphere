'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { useToast } from './Toast';

export default function ProductDetailClient({ product: initialProduct, slug }) {
  const [product, setProduct] = useState(initialProduct);
  const [mounted, setMounted] = useState(false);
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setMounted(true);
    if (!product && slug) {
      try {
        const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_products') || '[]');
        const found = localCustom.find((p) => p.slug === slug || p.id === slug);
        if (found) {
          setProduct(found);
        }
      } catch (e) {}
    }
  }, [product, slug]);

  if (!product) {
    if (!mounted) {
      return (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p>Завантаження інформації про товар...</p>
        </div>
      );
    }
    return (
      <div className="cart-empty" style={{ padding: '60px 0' }}>
        <div className="cart-empty__icon">🔍</div>
        <h2 className="cart-empty__title">Товар не знайдено</h2>
        <p className="cart-empty__text">Можливо, товар було видалено або посилання застаріло</p>
        <Link href="/shop" className="btn btn--primary" style={{ marginTop: 20 }}>
          <span>Повернутися до магазину</span>
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/hero_products.webp'];

  const inStock = product.status !== 'out_of_stock' && (product.stock > 0 || product.status === 'pre_order');

  const handleAddToCart = () => {
    addItem(product, quantity);
    showToast(`«${product.name}» додано до кошика!`, 'success');
  };

  return (
    <div className="product-page__grid">
      {/* Gallery */}
      <div className="product-gallery">
        <div className="product-gallery__main">
          <img
            src={images[selectedImage] || images[0]}
            alt={product.name}
          />
        </div>
        {images.length > 1 && (
          <div className="product-gallery__thumbs">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`product-gallery__thumb ${selectedImage === idx ? 'active' : ''}`}
                onClick={() => setSelectedImage(idx)}
              >
                <img src={img} alt={`${product.name} - фото ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="product-info">
        {(product.category_name || product.categories?.name) && (
          <div className="product-info__category">{product.category_name || product.categories?.name}</div>
        )}
        <h1 className="product-info__title">{product.name}</h1>
        {product.sku && <div className="product-info__sku">Артикул: {product.sku}</div>}

        <div className="product-info__price">{product.price} ₴</div>

        <div className={`product-info__stock ${inStock ? 'product-info__stock--in' : 'product-info__stock--out'}`}>
          {product.status === 'pre_order'
            ? '⏳ Під замовлення'
            : inStock
            ? `● В наявності (${product.stock || 1} шт.)`
            : '✕ Немає в наявності'}
        </div>

        <div className="product-info__divider" />

        <div className="product-info__actions">
          {inStock && (
            <div className="quantity-selector">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Зменшити"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={product.stock || 99}
              />
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                aria-label="Збільшити"
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn--primary"
            disabled={!inStock}
            onClick={handleAddToCart}
            style={{ flex: 1 }}
          >
            <span>{inStock ? 'Додати в кошик' : 'Немає в наявності'}</span>
          </button>
        </div>

        <div className="product-info__divider" />

        {product.description && (
          <div className="product-info__desc">
            <p>{product.description}</p>
          </div>
        )}

        {/* Specs Table */}
        <div className="product-info__specs">
          <h3 className="product-info__specs-title">Характеристики</h3>
          <table className="product-info__specs-table">
            <tbody>
              {product.brand && (
                <tr>
                  <td>Бренд / Майстер</td>
                  <td>{product.brand}</td>
                </tr>
              )}
              {product.material && (
                <tr>
                  <td>Матеріал</td>
                  <td>{product.material}</td>
                </tr>
              )}
              {product.dimensions && (
                <tr>
                  <td>Розміри</td>
                  <td>{product.dimensions}</td>
                </tr>
              )}
              {product.production_time && (
                <tr>
                  <td>Термін виготовлення</td>
                  <td>{product.production_time}</td>
                </tr>
              )}
              {product.weight && (
                <tr>
                  <td>Вага</td>
                  <td>{product.weight}</td>
                </tr>
              )}
              <tr>
                <td>Виробництво</td>
                <td>Україна, Павлоград (ручна робота)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
