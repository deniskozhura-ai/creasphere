import fs from 'fs';
import path from 'path';
import os from 'os';
import { DEMO_PRODUCTS } from './demo-data';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_products.json');

function initProducts() {
  // 1. Try reading from writable /tmp in serverless/dev
  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Try reading bundled static file
  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        try {
          fs.writeFileSync(WRITABLE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        } catch (e) {}
        return parsed;
      }
    }
  } catch (e) {}

  // 3. Fallback to demo data
  return [...DEMO_PRODUCTS];
}

export function getProducts() {
  return initProducts();
}

export function addProduct(product) {
  const current = getProducts();
  const updated = [product, ...current.filter((p) => p.id !== product.id && p.sku !== product.sku)];

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to tmp products file:', e.message);
  }

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return product;
}

export function updateProduct(id, updatedData) {
  const current = getProducts();
  const updated = current.map((p) => {
    if (p.id === id || p.sku === id) {
      return { ...p, ...updatedData, id: p.id };
    }
    return p;
  });

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return updated.find((p) => p.id === id || p.sku === id);
}

export function deleteProduct(id) {
  const current = getProducts();
  const updated = current.filter((p) => p.id !== id && p.sku !== id);

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return true;
}

/**
 * Atomic stock decrement for order processing.
 * Verifies all items have sufficient stock before decrementing.
 * Throws error if any item is out of stock or insufficient.
 */
export function decrementStockAtomic(items) {
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
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (e) {}

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (e) {}

  return true;
}
