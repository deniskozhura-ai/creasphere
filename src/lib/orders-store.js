import fs from 'fs';
import path from 'path';
import os from 'os';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'orders.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_orders.json');

const INITIAL_ORDERS = [
  {
    id: 'ord-1',
    order_number: 'CS-849201',
    customer_name: 'Олена Петренко',
    customer_phone: '+380 50 000 0001',
    customer_email: 'olena.demo@example.com',
    delivery_city: 'м. Київ',
    delivery_address: 'Нова Пошта Відділення № 45',
    delivery_method: 'nova_poshta',
    payment_method: 'card',
    total_amount: 1130,
    status: 'completed',
    created_at: '2026-09-08 14:30',
    notes: 'Зателефонуйте перед відправкою',
    items: [
      {
        id: 'p1',
        name: 'Подарунковий бокс «Теплий вечір»',
        price: 750,
        quantity: 1,
        image: '/gift_collection.webp',
      },
      {
        id: 'p2',
        name: 'Керамічна чашка «Павлоградські світанки»',
        price: 380,
        quantity: 1,
        image: '/gallery1.jpg',
      },
    ],
  },
  {
    id: 'ord-2',
    order_number: 'CS-849195',
    customer_name: 'Михайло Сидоренко',
    customer_phone: '+380 50 000 0002',
    customer_email: 'm.sydorenko@example.com',
    delivery_city: 'м. Павлоград',
    delivery_address: 'вул. Шевченка, 138б (Самовивіз)',
    delivery_method: 'pickup',
    payment_method: 'cash',
    total_amount: 750,
    status: 'pending',
    created_at: '2026-09-08 11:15',
    notes: 'Заберу у четвер після 16:00',
    items: [
      {
        id: 'p1',
        name: 'Подарунковий бокс «Теплий вечір»',
        price: 750,
        quantity: 1,
        image: '/gift_collection.webp',
      },
    ],
  },
  {
    id: 'ord-3',
    order_number: 'CS-849180',
    customer_name: 'Анна Коваль',
    customer_phone: '+380 50 000 0003',
    customer_email: 'koval_a@example.com',
    delivery_city: 'м. Дніпро',
    delivery_address: 'Поштомат № 1234',
    delivery_method: 'nova_poshta',
    payment_method: 'card',
    total_amount: 1570,
    status: 'processing',
    created_at: '2026-09-07 19:42',
    notes: 'Подарунок подрузі на день народження',
    items: [
      {
        id: 'p4',
        name: 'В’язаний ведмедик «Тедді»',
        price: 520,
        quantity: 1,
        image: '/workshop2.jpg',
      },
      {
        id: 'p5',
        name: 'Набір для створення мозаїки',
        price: 650,
        quantity: 1,
        image: '/kids_workshop.webp',
      },
      {
        id: 'p3',
        name: 'Набір соєвих свічок «Затишок»',
        price: 400,
        quantity: 1,
        image: '/gallery3.jpg',
      },
    ],
  },
];

export function getOrders() {
  if (globalThis.__creasphere_orders && Array.isArray(globalThis.__creasphere_orders)) {
    return globalThis.__creasphere_orders;
  }

  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis.__creasphere_orders = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis.__creasphere_orders = parsed;
        return parsed;
      }
    }
  } catch (err) {}

  globalThis.__creasphere_orders = [...INITIAL_ORDERS];
  return globalThis.__creasphere_orders;
}

export function addOrder(order) {
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
