import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ProductDetailClient from '@/components/ProductDetailClient';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { getProducts } from '@/lib/products-store';

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

  return fallback || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: 'Товар — CreaSphere',
    };
  }

  return {
    title: `${product.name} — CreaSphere`,
    description: product.description?.slice(0, 160) || `Купити ${product.name} в інтернет-магазині CreaSphere`,
    openGraph: {
      title: `${product.name} — CreaSphere`,
      description: product.description?.slice(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <div className="page-header__breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <Link href="/shop">Магазин</Link>
            {product?.category_name && (
              <>
                <span>/</span>
                <span>{product.category_name}</span>
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
      </div>
    </main>
  );
}
