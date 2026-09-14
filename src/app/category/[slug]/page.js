import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Pagination from '@/components/Pagination';
import ShopProductGrid from '@/components/ShopProductGrid';
import { DEMO_CATEGORIES } from '@/lib/demo-data';
import { getProducts } from '@/lib/products-store';
import { getBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const PER_PAGE = 24;

async function fetchCategory(slug) {
  if (!slug) return null;

  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {}

  let category = null;

  if (isSupabaseConfigured) {
    try {
      let { data } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', decodedSlug)
        .maybeSingle();

      if (!data && decodedSlug !== slug) {
        const res = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        data = res.data;
      }

      category = data;
    } catch (e) {
      console.warn('Category query fallback:', e.message);
    }
  }

  if (!category) {
    category = DEMO_CATEGORIES.find((c) => c.slug === decodedSlug || c.slug === slug);
  }

  return category || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  if (!category) {
    return {
      title: 'Категорію не знайдено — CreaSphere',
      robots: { index: false, follow: false },
    };
  }

  const title = `${category.name} — купити в CreaSphere | Павлоград`;
  const description =
    category.description?.slice(0, 160) ||
    `Купити товари категорії «${category.name}» ручної роботи в інтернет-магазині CreaSphere у Павлограді. Авторські вироби з доставкою по Україні.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${encodeURIComponent(category.slug || slug)}`,
    },
    openGraph: {
      title,
      description,
      url: `/category/${encodeURIComponent(category.slug || slug)}`,
      type: 'website',
      images: [
        {
          url: category.image || '/hero_products.webp',
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [category.image || '/hero_products.webp'],
    },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parseInt(sp?.page) || 1;
  const sort = sp?.sort || 'created_at';
  const offset = (page - 1) * PER_PAGE;

  const category = await fetchCategory(slug);

  if (!category) {
    notFound();
  }

  let subcategories = [];
  let products = null;
  let count = 0;

  if (isSupabaseConfigured) {
    try {
      const { data: subs } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', category.id)
        .order('name');
      subcategories = subs || [];

      const categoryIds = [category.id, ...subcategories.map((s) => s.id)];

      const sortMap = {
        created_at: { column: 'created_at', ascending: false },
        price_asc: { column: 'price', ascending: true },
        price_desc: { column: 'price', ascending: false },
        name: { column: 'name', ascending: true },
      };
      const sortConfig = sortMap[sort] || sortMap['created_at'];

      const res = await supabase
        .from('products')
        .select('*, categories(name, slug)', { count: 'exact' })
        .in('status', ['active', 'in_stock', 'pre_order'])
        .in('category_id', categoryIds)
        .order(sortConfig.column, { ascending: sortConfig.ascending })
        .range(offset, offset + PER_PAGE - 1);

      if (!res.error && Array.isArray(res.data)) {
        products = res.data.map((p) => ({
          ...p,
          category_name: p.categories?.name || category.name,
        }));
        count = res.count !== null && res.count !== undefined ? res.count : products.length;
      }
    } catch (e) {
      console.warn('Category products query error:', e.message);
    }
  }

  if (!products && !isSupabaseConfigured) {
    let list = getProducts().filter(
      (p) => String(p.category_id) === String(category.id) || p.category_slug === category.slug
    );

    if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'uk'));
    }
    count = list.length;
    products = list.slice(offset, offset + PER_PAGE);
  }

  const totalPages = Math.ceil(count / PER_PAGE);
  const baseUrl = getBaseUrl();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
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
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${baseUrl}/category/${encodeURIComponent(category.slug || slug)}`,
      },
    ],
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
            <Link href="/shop">Магазин</Link>
            <span>/</span>
            <span>{category.name}</span>
          </div>
          <h1 className="page-header__title">{category.name}</h1>
          {category.description && (
            <p style={{ marginTop: 12, color: 'var(--text-2)', fontSize: 15, maxWidth: 600 }}>
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="container">
        <div style={{ padding: '60px 0' }}>
          {(subcategories || []).length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              {subcategories.map((sub) => (
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

          <ShopProductGrid
            initialProducts={products}
            currentCategory={category.slug}
          />

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
