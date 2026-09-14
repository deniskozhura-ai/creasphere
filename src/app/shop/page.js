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
import { getBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const PER_PAGE = 24;

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const categorySlug = params?.category;

  let categoryName = null;
  if (categorySlug) {
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from('categories')
          .select('name')
          .eq('slug', categorySlug)
          .maybeSingle();
        if (data?.name) categoryName = data.name;
      } catch (e) {
        console.warn('Metadata category lookup error:', e.message);
      }
    }
    if (!categoryName) {
      const cats = getCategories();
      const found = cats.find((c) => c.slug === categorySlug) || DEMO_CATEGORIES.find((c) => c.slug === categorySlug);
      if (found?.name) categoryName = found.name;
    }
  }

  const title = categoryName
    ? `${categoryName} — купити в магазині CreaSphere | Павлоград`
    : 'Магазин авторських виробів та подарунків ручної роботи | CreaSphere';

  const description = categoryName
    ? `Каталог авторських подарунків у категорії «${categoryName}» ручної роботи в інтернет-магазині CreaSphere.`
    : 'Каталог подарунків ручної роботи, кераміки, сувенірів та авторських виробів майстрів у Павлограді з доставкою по Україні.';

  const canonicalUrl = categorySlug ? `/category/${encodeURIComponent(categorySlug)}` : '/shop';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: '/hero_products.webp',
          width: 1200,
          height: 630,
          alt: 'Магазин авторських подарунків CreaSphere',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/hero_products.webp'],
    },
  };
}

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
      const categoriesPromise = supabase
        .from('categories')
        .select('*')
        .order('name');

      let query = supabase
        .from('products')
        .select('*, categories(name, slug)', { count: 'exact' })
        .in('status', ['active', 'in_stock', 'pre_order']);

      if (category) {
        const { data: catData } = await categoriesPromise;
        if (catData && catData.length > 0) {
          categories = catData;
          const cat = catData.find((c) => c.slug === category);
          if (cat) {
            query = query.eq('category_id', cat.id);
          } else {
            query = query.eq('category_id', '00000000-0000-0000-0000-000000000000');
          }
        }
      }

      if (minPrice !== null) query = query.gte('price', minPrice);
      if (maxPrice !== null) query = query.lte('price', maxPrice);

      const sortMap = {
        created_at: { column: 'created_at', ascending: false },
        price_asc: { column: 'price', ascending: true },
        price_desc: { column: 'price', ascending: false },
        name: { column: 'name', ascending: true },
      };
      const sortConfig = sortMap[sort] || sortMap['created_at'];
      query = query.order(sortConfig.column, { ascending: sortConfig.ascending });
      query = query.range(offset, offset + PER_PAGE - 1);

      let res;
      if (category) {
        res = await query;
      } else {
        const [productsRes, catRes] = await Promise.all([query, categoriesPromise]);
        res = productsRes;
        if (catRes?.data && catRes.data.length > 0) {
          categories = catRes.data;
        }
      }

      if (!res.error && Array.isArray(res.data)) {
        products = res.data.map((p) => ({
          ...p,
          category_name: p.categories?.name || null,
        }));
        count = res.count !== null && res.count !== undefined ? res.count : products.length;
      }
    } catch (e) {
      console.warn('Supabase query fallback to demo data:', e.message);
    }
  }

  // Fallback to data store only if Supabase is unconfigured
  if (products === null && !isSupabaseConfigured) {
    let list = [...getProducts()];

    if (category) {
      const cat = categories.find((c) => c.slug === category);
      if (cat) {
        list = list.filter((p) => String(p.category_id) === String(cat.id) || p.category_slug === category);
      } else {
        list = [];
      }
    }

    if (minPrice !== null) list = list.filter((p) => p.price >= minPrice);
    if (maxPrice !== null) list = list.filter((p) => p.price <= maxPrice);

    if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'uk'));
    } else {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    count = list.length;
    products = list.slice(offset, offset + PER_PAGE);
  }

  // Final fallback to DEMO_CATEGORIES if empty
  if (categories.length === 0) {
    categories = DEMO_CATEGORIES;
  }

  const totalPages = Math.ceil(count / PER_PAGE);
  const currentParams = {};
  if (category) currentParams.category = category;
  if (sort !== 'created_at') currentParams.sort = sort;
  if (minPrice !== null) currentParams.min_price = minPrice;
  if (maxPrice !== null) currentParams.max_price = maxPrice;

  const baseUrl = getBaseUrl();
  const breadcrumbs = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Головна',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Магазин',
      item: `${baseUrl}/shop`,
    },
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
