import fs from 'fs';
import path from 'path';
import os from 'os';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'orders.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_orders.json');

const INITIAL_ORDERS = [];

export function getOrders() {
  if (globalThis.__creasphere_orders && Array.isArray(globalThis.__creasphere_orders)) {
    return globalThis.__creasphere_orders;
  }

  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        globalThis.__creasphere_orders = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        globalThis.__creasphere_orders = parsed;
        return parsed;
      }
    }
  } catch (err) {}

  globalThis.__creasphere_orders = [...INITIAL_ORDERS];
  return globalThis.__creasphere_orders;
}

export function addOrder(order) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local orders store mutation is disabled in production. Use Supabase database.');
  }
  const list = getOrders();
  const updated = [order, ...list];
  globalThis.__creasphere_orders = updated;

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

export function updateOrderStatus(id, newStatus) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local orders store mutation is disabled in production. Use Supabase database.');
  }
  const list = getOrders();
  const updated = list.map((item) =>
    item.id === id || item.order_number === id ? { ...item, status: newStatus } : item
  );
  globalThis.__creasphere_orders = updated;

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

export function deleteOrder(id) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local orders store mutation is disabled in production. Use Supabase database.');
  }
  const list = getOrders();
  const updated = list.filter((item) => item.id !== id && item.order_number !== id);
  globalThis.__creasphere_orders = updated;

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
