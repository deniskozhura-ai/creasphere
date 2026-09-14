import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ProductDetailClient from '@/components/ProductDetailClient';
import ProductCard from '@/components/ProductCard';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { getProducts } from '@/lib/products-store';
import { getBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

async function fetchProduct(slugParam) {
  if (!slugParam) return null;

  let decodedSlug = slugParam;
  try {
    decodedSlug = decodeURIComponent(slugParam);
  } catch {
    // Keep slugParam if malformed
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugParam);

  if (isSupabaseConfigured) {
    try {
      if (isUuid) {
        const uuidVal = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug)
          ? decodedSlug
          : slugParam;
        const { data } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('id', uuidVal)
          .maybeSingle();

        if (data) {
          return {
            ...data,
            category_name: data.categories?.name || null,
            category_slug: data.categories?.slug || data.category || null,
          };
        }
      }

      // 1. Try decoded slug (e.g. 'картина-осени')
      let { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('slug', decodedSlug)
        .maybeSingle();

      // 2. If not found and decodedSlug differs from slugParam, try raw slugParam
      if (!data && decodedSlug !== slugParam) {
        const res = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('slug', slugParam)
          .maybeSingle();
        data = res.data;
      }

      // 3. If still not found, try matching by SKU
      if (!data) {
        const res = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('sku', decodedSlug)
          .maybeSingle();
        data = res.data;
      }

      if (data) {
        return {
          ...data,
          category_name: data.categories?.name || null,
          category_slug: data.categories?.slug || data.category || null,
        };
      }
    } catch (e) {
      console.warn('Supabase product query error:', e.message);
    }
  }

  // Fallback to local store or demo products
  const list = getProducts();
  let fallback = list.find(
    (p) =>
      p.slug === decodedSlug ||
      p.slug === slugParam ||
      p.id === decodedSlug ||
      p.id === slugParam ||
      p.sku === decodedSlug
  );

  if (!fallback) {
    fallback = DEMO_PRODUCTS.find(
      (p) =>
        p.slug === decodedSlug ||
        p.slug === slugParam ||
        p.id === decodedSlug ||
        p.id === slugParam ||
        p.sku === decodedSlug
    );
  }

  if (fallback) {
    return {
      ...fallback,
      category_slug: fallback.category_slug || fallback.category || null,
    };
  }

  return null;
}

async function fetchRelatedProducts(categoryId, currentProductId) {
  let related = [];

  if (isSupabaseConfigured) {
    try {
      if (categoryId) {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .in('status', ['active', 'in_stock', 'pre_order'])
          .eq('category_id', categoryId)
          .neq('id', currentProductId)
          .limit(4);

        if (!error && Array.isArray(data) && data.length > 0) {
          related = data.map((p) => ({
            ...p,
            category_name: p.categories?.name || null,
            category_slug: p.categories?.slug || null,
          }));
        }
      }

      if (related.length < 4) {
        const excludeIds = [currentProductId, ...related.map((r) => r.id)];
        const { data: otherData } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .in('status', ['active', 'in_stock', 'pre_order'])
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .limit(4 - related.length);

        if (Array.isArray(otherData) && otherData.length > 0) {
          const formatted = otherData.map((p) => ({
            ...p,
            category_name: p.categories?.name || null,
            category_slug: p.categories?.slug || null,
          }));
          related = [...related, ...formatted];
        }
      }
    } catch (e) {
      console.warn('Related products query error:', e.message);
    }
  }

  // Fallback to local store
  if (related.length === 0) {
    const all = getProducts();
    const sameCat = all.filter(
      (p) =>
        categoryId &&
        (String(p.category_id) === String(categoryId) || p.category === categoryId) &&
        p.id !== currentProductId &&
        p.slug !== currentProductId
    );
    const other = all.filter(
      (p) =>
        p.id !== currentProductId &&
        p.slug !== currentProductId &&
        !sameCat.some((sc) => sc.id === p.id)
    );
    related = [...sameCat, ...other].slice(0, 4);
  }

  return related;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: 'Товар не знайдено — CreaSphere',
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.name} — купити в CreaSphere | Павлоград`;
  const description =
    product.description?.slice(0, 160) ||
    `Купити ${product.name} ручної роботи в інтернет-магазині CreaSphere у Павлограді. Ціна: ${product.price} ₴.`;
  const canonicalPath = `/product/${product.slug ? encodeURIComponent(product.slug) : product.id}`;
  const imageUrl = product.images?.[0] || '/hero_products.webp';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(product.category_id || product.category, product.id);

  const baseUrl = getBaseUrl();
  const canonicalSlug = product.slug ? encodeURIComponent(product.slug) : product.id;
  const productUrl = `${baseUrl}/product/${canonicalSlug}`;

  const isPreOrder = product.status === 'pre_order';
  const isInStock =
    (product.stock === undefined || product.stock > 0) && product.status !== 'out_of_stock';
  const availability = isPreOrder
    ? 'https://schema.org/PreOrder'
    : isInStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const productImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images.map((img) =>
          img.startsWith('http') ? img : `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`
        )
      : [`${baseUrl}/hero_products.webp`];

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: productImages,
    description: product.description || `Авторський виріб ${product.name} від CreaSphere`,
    ...(product.sku ? { sku: product.sku } : {}),
    brand: {
      '@type': 'Brand',
      name: 'CreaSphere',
    },
    ...(product.category_name ? { category: product.category_name } : {}),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'UAH',
      price: Number(product.price || 0),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'CreaSphere',
      },
    },
  };

  const breadcrumbsList = [
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

  if (product.category_name) {
    const catUrl = product.category_slug
      ? `${baseUrl}/category/${encodeURIComponent(product.category_slug)}`
      : `${baseUrl}/shop`;
    breadcrumbsList.push({
      '@type': 'ListItem',
      position: 3,
      name: product.category_name,
      item: catUrl,
    });
  }

  breadcrumbsList.push({
    '@type': 'ListItem',
    position: breadcrumbsList.length + 1,
    name: product.name,
    item: productUrl,
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbsList,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
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
            {product?.category_name && (
              <>
                <span>/</span>
                {product.category_slug ? (
                  <Link href={`/category/${encodeURIComponent(product.category_slug)}`}>
                    {product.category_name}
                  </Link>
                ) : (
                  <span>{product.category_name}</span>
                )}
              </>
            )}
            {product?.name && (
              <>
                <span>/</span>
                <span>{product.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="product-page">
          <ProductDetailClient product={product} slug={slug} />
        </div>

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="related-products" style={{ marginTop: '64px', marginBottom: '60px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                marginBottom: '24px',
                color: 'var(--text)',
              }}
            >
              Схожі вироби
            </h2>
            <div className="products-grid">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
