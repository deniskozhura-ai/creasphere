import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

export const metadata = {
  title: 'Пошук — CreaSphere',
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const q = (params?.q || '').trim();

  let products = [];
  if (q) {
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('status', 'active')
          .or(`name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`)
          .limit(48);

        if (data && data.length > 0) {
          products = data.map((p) => ({
            ...p,
            category_name: p.categories?.name || null,
          }));
        }
      } catch (e) {
        console.warn('Search query error:', e.message);
      }
    }

    if (products.length === 0) {
      const qLower = q.toLowerCase();
      products = DEMO_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(qLower) ||
          p.description.toLowerCase().includes(qLower) ||
          p.brand?.toLowerCase().includes(qLower)
      );
    }
  }

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <div className="page-header__breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <Link href="/shop">Магазин</Link>
            <span>/</span>
            <span>Пошук</span>
          </div>
          <h1 className="page-header__title">
            {q ? `Результати пошуку: «${q}»` : 'Пошук товарів'}
          </h1>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
        <form action="/search" method="GET" className="search-bar" style={{ marginBottom: 48 }}>
          <span className="search-bar__icon">🔍</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Пошук подарунків, сувенірів, матеріалів..."
            className="search-bar__input"
          />
        </form>

        {q ? (
          products.length > 0 ? (
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
          ) : (
            <div className="cart-empty">
              <div className="cart-empty__icon">🔍</div>
              <h2 className="cart-empty__title">Нічого не знайдено</h2>
              <p className="cart-empty__text">
                За запитом «{q}» нічого не знайдено. Спробуйте змінити пошуковий запит.
              </p>
              <Link href="/shop" className="btn btn--primary">
                <span>Переглянути весь каталог</span>
              </Link>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
            Введіть назву товару або ключове слово для пошуку
          </div>
        )}
      </div>
    </main>
  );
}
