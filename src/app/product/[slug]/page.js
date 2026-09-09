import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ProductDetailClient from '@/components/ProductDetailClient';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { getProducts } from '@/lib/products-store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let product = null;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('products')
        .select('name, description, images')
        .eq('slug', slug)
        .single();
      product = data;
    } catch (e) {
      console.warn('Supabase metadata error:', e.message);
    }
  }

  if (!product) {
    const list = getProducts();
    product = list.find((p) => p.slug === slug || p.id === slug);
  }

  if (!product) {
    product = DEMO_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  }

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
  let product = null;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .single();
      if (data) {
        product = {
          ...data,
          category_name: data.categories?.name || null,
        };
      }
    } catch (e) {
      console.warn('Supabase product error:', e.message);
    }
  }

  if (!product) {
    const list = getProducts();
    product = list.find((p) => p.slug === slug || p.id === slug);
  }

  if (!product) {
    product = DEMO_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
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
