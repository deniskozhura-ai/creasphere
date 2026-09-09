import fs from 'fs';
import path from 'path';
import { DEMO_PRODUCTS } from './demo-data';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');

export function getProducts() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read products.json:', err.message);
  }
  return DEMO_PRODUCTS;
}

export function addProduct(product) {
  try {
    const list = getProducts();
    const updated = [product, ...list];
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return product;
  } catch (err) {
    console.warn('Could not write to products.json:', err.message);
    return product;
  }
}

export function deleteProduct(id) {
  try {
    const list = getProducts();
    const updated = list.filter((p) => p.id !== id && p.sku !== id);
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('Could not delete from products.json:', err.message);
    return false;
  }
}
