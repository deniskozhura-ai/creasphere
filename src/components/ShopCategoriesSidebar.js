'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ShopCategoriesSidebar({ categories = [], currentCategory = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  // Find active category display name
  const activeCategory = (categories || []).find((c) => c.slug === currentCategory);
  const activeLabel = activeCategory ? activeCategory.name : 'Усі товари';

  const rootCategories = (categories || []).filter((c) => !c.parent_id);

  return (
    <aside className="shop-sidebar">
      {/* Mobile Category Toggle Button (hidden on desktop) */}
      <div className="shop-mobile-categories-header">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`shop-mobile-cat-btn ${isOpen ? 'active' : ''}`}
          aria-expanded={isOpen}
          aria-label="Категорії товарів"
        >
          <div className="shop-mobile-cat-btn__left">
            <span className="shop-mobile-cat-btn__icon">🏷️</span>
            <div className="shop-mobile-cat-btn__text">
              <span className="shop-mobile-cat-btn__title">Категорія:</span>
              <span className="shop-mobile-cat-btn__val">{activeLabel}</span>
            </div>
          </div>
          <span className={`shop-mobile-cat-btn__chevron ${isOpen ? 'open' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </button>

        {currentCategory && (
          <Link href="/shop" className="shop-mobile-cat-reset" title="Скинути до всіх товарів">
            Скинути ✕
          </Link>
        )}
      </div>

      {/* Categories Content: always visible on desktop, toggleable dropdown on mobile */}
      <div className={`shop-sidebar__dropdown ${isOpen ? 'is-open' : ''}`}>
        <div className="shop-sidebar__section">
          <h3 className="shop-sidebar__title">Категорії</h3>
          <ul className="shop-sidebar__list">
            <li>
              <Link
                href="/shop"
                className={!currentCategory ? 'active' : ''}
                onClick={() => setIsOpen(false)}
              >
                <span>✨ Усі товари</span>
              </Link>
            </li>
            {rootCategories.map((cat) => {
              const subcategories = (categories || []).filter((c) => c.parent_id === cat.id);
              const isActive = currentCategory === cat.slug;

              return (
                <li key={cat.id}>
                  <Link
                    href={`/shop?category=${cat.slug}`}
                    className={isActive ? 'active' : ''}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{cat.name}</span>
                  </Link>
                  {subcategories.length > 0 && (
                    <ul className="shop-sidebar__list shop-sidebar__sublist" style={{ paddingLeft: 16, marginTop: 4 }}>
                      {subcategories.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/shop?category=${sub.slug}`}
                            className={currentCategory === sub.slug ? 'active' : ''}
                            onClick={() => setIsOpen(false)}
                          >
                            <span>{sub.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
