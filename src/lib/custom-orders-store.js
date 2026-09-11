import fs from 'fs';
import path from 'path';
import os from 'os';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'custom_orders.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_custom_orders.json');

const INITIAL_CUSTOM_ORDERS = [];

export function getCustomOrders() {
  if (globalThis.__creasphere_custom_orders && Array.isArray(globalThis.__creasphere_custom_orders)) {
    return globalThis.__creasphere_custom_orders;
  }

  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        globalThis.__creasphere_custom_orders = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        globalThis.__creasphere_custom_orders = parsed;
        return parsed;
      }
    }
  } catch (err) {}

  globalThis.__creasphere_custom_orders = [...INITIAL_CUSTOM_ORDERS];
  return globalThis.__creasphere_custom_orders;
}

export function addCustomOrder(order) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local custom orders store mutation is disabled in production. Use Supabase database.');
  }
  const list = getCustomOrders();
  const updated = [order, ...list];
  globalThis.__creasphere_custom_orders = updated;

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {}

  return order;
}

export function updateCustomOrderStatus(id, newStatus) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local custom orders store mutation is disabled in production. Use Supabase database.');
  }
  const list = getCustomOrders();
  const updated = list.map((item) =>
    item.id === id || item.order_number === id ? { ...item, status: newStatus } : item
  );
  globalThis.__creasphere_custom_orders = updated;

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {}

  return updated;
}

export function deleteCustomOrder(id) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local custom orders store mutation is disabled in production. Use Supabase database.');
  }
  const list = getCustomOrders();
  const updated = list.filter((item) => item.id !== id && item.order_number !== id);
  globalThis.__creasphere_custom_orders = updated;

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {}

  return true;
}
