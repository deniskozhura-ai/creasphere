'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';
import { useToast } from './Toast';

export default function ProductDetailClient({ product }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/hero_products.webp'];

  const inStock = product.stock > 0;

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
        {product.categories?.name && (
          <div className="product-info__category">{product.categories.name}</div>
        )}
        <h1 className="product-info__title">{product.name}</h1>
        {product.sku && <div className="product-info__sku">Артикул: {product.sku}</div>}

        <div className="product-info__price">{product.price} ₴</div>

        <div className={`product-info__stock ${inStock ? 'product-info__stock--in' : 'product-info__stock--out'}`}>
          {inStock ? `● В наявності (${product.stock} шт.)` : '✕ Немає в наявності'}
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
                max={product.stock}
              />
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
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
