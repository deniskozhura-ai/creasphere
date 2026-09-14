import { getBaseUrl } from '@/lib/site-url';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getProducts } from '@/lib/products-store';
import { getCategories } from '@/lib/categories-store';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '@/lib/demo-data';

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap() {
  const baseUrl = getBaseUrl();
  const now = new Date().toISOString();

  // 1. Static public routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/workshops`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rent`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // 2. Fetch categories
  let categories = [];
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('slug, updated_at, created_at');
      if (!error && Array.isArray(data)) {
        categories = data;
      }
    } catch (e) {
      console.warn('Sitemap categories fetch fallback:', e.message);
    }
  }

  if (categories.length === 0) {
    const storeCategories = getCategories();
    categories = storeCategories.length > 0 ? storeCategories : DEMO_CATEGORIES;
  }

  const categoryRoutes = categories
    .filter((cat) => cat && cat.slug)
    .map((cat) => ({
      url: `${baseUrl}/category/${encodeURIComponent(cat.slug)}`,
      lastModified: cat.updated_at || cat.created_at || now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // 3. Fetch active products
  let products = [];
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('slug, id, updated_at, created_at, status')
        .in('status', ['active', 'in_stock', 'pre_order']);
      if (!error && Array.isArray(data)) {
        products = data;
      }
    } catch (e) {
      console.warn('Sitemap products fetch fallback:', e.message);
    }
  }

  if (products.length === 0) {
    const storeProducts = getProducts();
    const source = storeProducts.length > 0 ? storeProducts : DEMO_PRODUCTS;
    products = source.filter(
      (p) => p.status === 'active' || p.status === 'in_stock' || p.status === 'pre_order' || !p.status
    );
  }

  const productRoutes = products
    .filter((p) => p && (p.slug || p.id))
    .map((p) => {
      const pathParam = p.slug ? encodeURIComponent(p.slug) : p.id;
      return {
        url: `${baseUrl}/product/${pathParam}`,
        lastModified: p.updated_at || p.created_at || now,
        changeFrequency: 'daily',
        priority: 0.9,
      };
    });

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
