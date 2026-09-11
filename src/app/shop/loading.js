import Link from 'next/link';

export default function ShopLoading() {
  const skeletonCards = Array.from({ length: 8 }, (_, i) => i);
  const skeletonCategories = Array.from({ length: 6 }, (_, i) => i);

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <div className="page-header__breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <span>Магазин</span>
          </div>
          <h1 className="page-header__title">Магазин</h1>
        </div>
      </div>

      <div className="container">
        <div className="shop-layout">
          <aside className="shop-sidebar">
            <div className="shop-sidebar__section">
              <h3 className="shop-sidebar__title">Категорії</h3>
              <ul className="shop-sidebar__list">
                {skeletonCategories.map((id) => (
                  <li key={id} style={{ marginBottom: 12 }}>
                    <div
                      className="skeleton-box"
                      style={{
                        height: 20,
                        width: id === 0 ? '70%' : `${50 + (id * 9) % 35}%`,
                        borderRadius: 4,
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div>
            {/* Custom order banner skeleton placeholder */}
            <div
              className="skeleton-box"
              style={{
                height: 110,
                borderRadius: 16,
                marginBottom: 28,
              }}
            />

            <div className="products-toolbar">
              <div
                className="skeleton-box"
                style={{ width: 100, height: 18, borderRadius: 4 }}
              />
              <div
                className="skeleton-box"
                style={{ width: 140, height: 38, borderRadius: 8 }}
              />
            </div>

            <div className="products-grid">
              {skeletonCards.map((id) => (
                <div key={id} className="product-card" style={{ pointerEvents: 'none' }}>
                  <div
                    className="product-card__image skeleton-box"
                    style={{ aspectRatio: '1/1', width: '100%' }}
                  />
                  <div className="product-card__body">
                    <div
                      className="skeleton-box"
                      style={{ width: '40%', height: 12, marginBottom: 8, borderRadius: 3 }}
                    />
                    <div
                      className="skeleton-box"
                      style={{ width: '85%', height: 16, marginBottom: 16, borderRadius: 3 }}
                    />
                    <div className="product-card__bottom">
                      <div
                        className="skeleton-box"
                        style={{ width: 70, height: 20, borderRadius: 4 }}
                      />
                      <div
                        className="skeleton-box"
                        style={{ width: 36, height: 36, borderRadius: '50%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
