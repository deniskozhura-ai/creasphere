import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';
import CustomOrderBanner from '@/components/CustomOrderBanner';
import ShopProductGrid from '@/components/ShopProductGrid';
import ShopCategoriesSidebar from '@/components/ShopCategoriesSidebar';
import { DEMO_CATEGORIES } from '@/lib/demo-data';
import { getProducts } from '@/lib/products-store';
import { getCategories } from '@/lib/categories-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Магазин — CreaSphere',
  description: 'Каталог подарунків ручної роботи, сувенірів та авторських виробів CreaSphere.',
};

const PER_PAGE = 24;

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params?.page) || 1;
  const sort = params?.sort || 'created_at';
  const category = params?.category || '';
  const minPrice = params?.min_price ? parseFloat(params.min_price) : null;
  const maxPrice = params?.max_price ? parseFloat(params.max_price) : null;

  const offset = (page - 1) * PER_PAGE;

  let products = null;
  let count = 0;
  let categories = getCategories();

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('products')
        .select('*, categories(name, slug)', { count: 'exact' })
        .in('status', ['active', 'in_stock', 'pre_order']);

      if (category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();
        if (cat) query = query.eq('category_id', cat.id);
      }

      if (minPrice !== null) query = query.gte('price', minPrice);
      if (maxPrice !== null) query = query.lte('price', maxPrice);

      const sortMap = {
        'created_at': { column: 'created_at', ascending: false },
        'price_asc': { column: 'price', ascending: true },
        'price_desc': { column: 'price', ascending: false },
        'name': { column: 'name', ascending: true },
      };
      const sortConfig = sortMap[sort] || sortMap['created_at'];
      query = query.order(sortConfig.column, { ascending: sortConfig.ascending });
      query = query.range(offset, offset + PER_PAGE - 1);

      const res = await query;
      if (!res.error && Array.isArray(res.data)) {
        products = res.data.map((p) => ({
          ...p,
          category_name: p.categories?.name || null,
        }));
        count = res.count !== null && res.count !== undefined ? res.count : products.length;
      }

      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (catData && catData.length > 0) {
        categories = catData;
      }
    } catch (e) {
      console.warn('Supabase query fallback to demo data:', e.message);
    }
  }

  // Fallback to data store only if Supabase is unconfigured
  if (products === null && !isSupabaseConfigured) {
    let list = [...getProducts()];

    if (category) {
      const cat = categories.find(c => c.slug === category);
      if (cat) {
        list = list.filter(p => String(p.category_id) === String(cat.id));
      }
    }

    if (minPrice !== null) {
      list = list.filter(p => p.price >= minPrice);
    }

    if (maxPrice !== null) {
      list = list.filter(p => p.price <= maxPrice);
    }

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

  const currentParams = {};
  if (sort && sort !== 'created_at') currentParams.sort = sort;
  if (category) currentParams.category = category;
  if (minPrice !== null) currentParams.min_price = minPrice.toString();
  if (maxPrice !== null) currentParams.max_price = maxPrice.toString();

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
          <ShopCategoriesSidebar categories={categories} currentCategory={category} />

          <div>
            <CustomOrderBanner />

            <div className="products-toolbar">
              <span className="products-toolbar__count">
                {count} товарів
              </span>
              <div className="products-toolbar__sort">
                <SortSelect currentSort={sort} />
              </div>
            </div>

            <ShopProductGrid
              initialProducts={products}
              currentCategory={category}
              minPrice={minPrice}
              maxPrice={maxPrice}
            />

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/shop"
              searchParams={currentParams}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
