import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '@/lib/demo-data';

const PER_PAGE = 24;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let category = null;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('categories')
        .select('name, description')
        .eq('slug', slug)
        .single();
      category = data;
    } catch (e) {
      console.warn('Category metadata fallback:', e.message);
    }
  }

  if (!category) {
    category = DEMO_CATEGORIES.find(c => c.slug === slug);
  }

  return {
    title: category ? `${category.name} — CreaSphere` : 'Категорія — CreaSphere',
    description: category?.description || `Товари категорії ${category?.name || ''} в магазині CreaSphere`,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parseInt(sp?.page) || 1;
  const sort = sp?.sort || 'created_at';
  const offset = (page - 1) * PER_PAGE;

  let category = null;
  let subcategories = [];
  let products = null;
  let count = 0;

  if (isSupabaseConfigured) {
    try {
      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (cat) {
        category = cat;
        const { data: subs } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', category.id)
          .order('name');
        subcategories = subs || [];

        const categoryIds = [category.id, ...subcategories.map(s => s.id)];

        const sortMap = {
          'created_at': { column: 'created_at', ascending: false },
          'price_asc': { column: 'price', ascending: true },
          'price_desc': { column: 'price', ascending: false },
          'name': { column: 'name', ascending: true },
        };
        const sortConfig = sortMap[sort] || sortMap['created_at'];

        const res = await supabase
          .from('products')
          .select('*, categories(name, slug)', { count: 'exact' })
          .eq('status', 'active')
          .in('category_id', categoryIds)
          .order(sortConfig.column, { ascending: sortConfig.ascending })
          .range(offset, offset + PER_PAGE - 1);

        if (res.data && res.data.length > 0) {
          products = res.data.map(p => ({
            ...p,
            category_name: p.categories?.name || category.name,
          }));
          count = res.count || products.length;
        }
      }
    } catch (e) {
      console.warn('Category query fallback:', e.message);
    }
  }

  // Demo fallback
  if (!category) {
    category = DEMO_CATEGORIES.find(c => c.slug === slug);
  }

  if (!category) {
    return (
      <main>
        <div className="page-header">
          <div className="container">
            <h1 className="page-header__title">Категорію не знайдено</h1>
            <p style={{ marginTop: 16 }}>
              <Link href="/shop" className="btn btn--primary">
                <span>До магазину</span>
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!products) {
    let list = DEMO_PRODUCTS.filter(p => p.category_id === category.id);
    if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    }
    count = list.length;
    products = list.slice(offset, offset + PER_PAGE);
  }

  const totalPages = Math.ceil(count / PER_PAGE);

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <div className="page-header__breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <Link href="/shop">Магазин</Link>
            <span>/</span>
            <span>{category.name}</span>
          </div>
          <h1 className="page-header__title">{category.name}</h1>
          {category.description && (
            <p style={{ marginTop: 12, color: 'var(--text-2)', fontSize: 15, maxWidth: 600 }}>{category.description}</p>
          )}
        </div>
      </div>

      <div className="container">
        <div style={{ padding: '60px 0' }}>
          {(subcategories || []).length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              {subcategories.map(sub => (
                <Link
                  key={sub.id}
                  href={`/category/${sub.slug}`}
                  className="btn btn--ghost btn--sm"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          <div className="products-toolbar">
            <span className="products-toolbar__count">{count} товарів</span>
          </div>

          {products.length > 0 ? (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="cart-empty">
              <div className="cart-empty__icon">📦</div>
              <h2 className="cart-empty__title">У цій категорії поки немає товарів</h2>
              <Link href="/shop" className="btn btn--primary"><span>До магазину</span></Link>
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/category/${slug}`}
            searchParams={sort !== 'created_at' ? { sort } : {}}
          />
        </div>
      </div>
    </main>
  );
}
