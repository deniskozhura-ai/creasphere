import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'custom_orders.json');

const INITIAL_CUSTOM_ORDERS = [
  {
    id: 'cst-1',
    order_number: 'CST-849101',
    customer_name: 'Ірина Мельник',
    customer_phone: '+380 67 111 2233',
    status: 'pending_call',
    created_at: '2026-09-09 10:15',
  },
  {
    id: 'cst-2',
    order_number: 'CST-849080',
    customer_name: 'Сергій Кравченко',
    customer_phone: '+380 50 888 7766',
    status: 'called',
    created_at: '2026-09-08 17:30',
  },
];

export function getCustomOrders() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read custom_orders.json:', err.message);
  }
  return INITIAL_CUSTOM_ORDERS;
}

export function addCustomOrder(order) {
  try {
    const list = getCustomOrders();
    const updated = [order, ...list];
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return order;
  } catch (err) {
    console.warn('Could not write to custom_orders.json:', err.message);
    return order;
  }
}

export function updateCustomOrderStatus(id, newStatus) {
  try {
    const list = getCustomOrders();
    const updated = list.map((item) =>
      item.id === id || item.order_number === id ? { ...item, status: newStatus } : item
    );
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.warn('Could not update custom_orders.json:', err.message);
    return [];
  }
}
