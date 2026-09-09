import fs from 'fs';
import path from 'path';
import { DEMO_PRODUCTS } from './demo-data';

// Static bundled catalog used strictly as read-only seed/fallback in development/testing.
// In production, Supabase database is the sole authoritative source of truth.
const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');

function initProducts() {
  // Try reading bundled static file (development/testing)
  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // Fallback to demo data
  return [...DEMO_PRODUCTS];
}

export function getProducts() {
  return initProducts();
}

export function addProduct(product) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local products store mutation is disabled in production. Use Supabase database.');
  }

  const current = getProducts();
  const updated = [product, ...current.filter((p) => p.id !== product.id && p.sku !== product.sku)];

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return product;
}

export function updateProduct(id, updatedData) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local products store mutation is disabled in production. Use Supabase database.');
  }

  const current = getProducts();
  const updated = current.map((p) => {
    if (p.id === id || p.sku === id) {
      return { ...p, ...updatedData, id: p.id };
    }
    return p;
  });

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return updated.find((p) => p.id === id || p.sku === id);
}

export function deleteProduct(id) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local products store mutation is disabled in production. Use Supabase database.');
  }

  const current = getProducts();
  const updated = current.filter((p) => p.id !== id && p.sku !== id);

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return true;
}

/**
 * Atomic stock decrement for order processing in local development / offline test runs.
 * In production, atomic decrement is handled strictly by public.create_order_atomic in Supabase.
 */
export function decrementStockAtomic(items) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local products store stock decrement is disabled in production. Use create_order_atomic Supabase RPC.');
  }

  const products = getProducts();

  // Phase 1: Verify all products and quantities
  for (const item of items) {
    const product = products.find((p) => p.id === item.id || p.sku === item.id || p.slug === item.id);
    if (!product) {
      throw new Error(`PRODUCT_NOT_FOUND: ${item.id}`);
    }
    if (product.status !== 'pre_order' && (product.stock === undefined || product.stock < item.quantity)) {
      throw new Error(`INSUFFICIENT_STOCK: ${product.name} (available: ${product.stock || 0}, requested: ${item.quantity})`);
    }
  }

  // Phase 2: Decrement stock
  for (const item of items) {
    const product = products.find((p) => p.id === item.id || p.sku === item.id || p.slug === item.id);
    if (product && product.status !== 'pre_order') {
      product.stock = Math.max(0, (product.stock || 0) - item.quantity);
      if (product.stock === 0) {
        product.status = 'out_of_stock';
      }
    }
  }

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (e) {}

  return true;
}
