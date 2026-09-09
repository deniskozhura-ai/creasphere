import fs from 'fs';
import path from 'path';
import os from 'os';
import { DEMO_PRODUCTS } from './demo-data';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_products.json');

function initProducts() {
  if (globalThis.__creasphere_products && Array.isArray(globalThis.__creasphere_products)) {
    return globalThis.__creasphere_products;
  }

  // 1. Try reading from writable /tmp in serverless
  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis.__creasphere_products = parsed;
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
        globalThis.__creasphere_products = parsed;
        try {
          fs.writeFileSync(WRITABLE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        } catch (e) {}
        return parsed;
      }
    }
  } catch (e) {}

  // 3. Fallback to demo data
  globalThis.__creasphere_products = [...DEMO_PRODUCTS];
  return globalThis.__creasphere_products;
}

export function getProducts() {
  return initProducts();
}

export function addProduct(product) {
  const current = getProducts();
  const updated = [product, ...current.filter((p) => p.id !== product.id && p.sku !== product.sku)];
  globalThis.__creasphere_products = updated;

  // Save to /tmp (writable on Netlify and serverless)
  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to tmp products file:', e.message);
  }

  // Also save to bundle file in local dev if writable
  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return product;
}

export function deleteProduct(id) {
  const current = getProducts();
  const updated = current.filter((p) => p.id !== id && p.sku !== id);
  globalThis.__creasphere_products = updated;

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return true;
}
