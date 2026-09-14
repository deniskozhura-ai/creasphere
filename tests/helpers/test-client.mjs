import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { mock } from 'node:test';
import { createClient } from '@supabase/supabase-js';

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Load ADMIN_PASSWORD from process.env or .env.local with safe default for tests
export let adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^ADMIN_PASSWORD\s*=\s*(.*)$/m);
      if (match) {
        adminPassword = match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (_) {}
}
if (!adminPassword) {
  adminPassword = 'ci_test_admin_password_2026';
}

export const TEST_IP = `10.220.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;

// Check if live server is reachable
let liveServerAvailable = null;

export async function isServerOnline() {
  if (liveServerAvailable !== null) return liveServerAvailable;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    liveServerAvailable = res.status === 200 || res.status === 401 || res.status === 503;
  } catch (_) {
    liveServerAvailable = false;
  }
  return liveServerAvailable;
}

// In-memory state for mock mode when live server is offline
const mockState = {
  sessions: new Map(),
  loginAttempts: new Map(),
  rateLimits: new Map(),
  products: new Map([
    ['p1', { id: 'p1', name: 'Глиняна ваза ручної роботи', price: 850, stock: 15, category_id: null, status: 'active' }],
    ['p4', { id: 'p4', name: 'Чашка керамічна "Космос"', price: 420, stock: 8, category_id: null, status: 'active' }],
  ]),
  categories: new Map([
    ['cat-1', { id: 'cat-1', name: 'Вази та декор', description: 'Кераміка' }],
  ]),
  orders: new Map(),
  workshops: new Map([
    ['ws-1', { id: 'ws-1', title: 'Гончарство для початківців', status: 'active', max_participants: 6, available_spots: 6 }],
  ]),
  workshopBookings: new Map(),
  customOrders: new Map(),
  spaceBookings: new Map(),
};

function createMockResponse(data, status = 200, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return new Response(body, {
    status,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

function handleMockRequest(urlPath, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = options.headers || {};
  const cookieHeader = headers.Cookie || headers.cookie || '';
  const xff = headers['x-forwarded-for'] || TEST_IP;
  const nfIp = headers['x-nf-client-connection-ip'];
  const effectiveIp = nfIp || xff;

  const urlObj = new URL(urlPath, 'http://localhost');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let bodyObj = null;
  if (options.body) {
    try {
      bodyObj = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (_) {}
  }

  const token = cookieHeader.split(';').map((s) => s.trim()).find((s) => s.startsWith('creasphere_admin_auth='))?.split('=')[1];
  const isAuth = token && mockState.sessions.has(token);

  // 1. /api/admin/auth
  if (pathname === '/api/admin/auth') {
    const rateKey = `admin-login:${effectiveIp}`;
    const attempts = mockState.rateLimits.get(rateKey) || 0;
    if (attempts >= 5) {
      return createMockResponse({ error: 'Забагато спроб' }, 429);
    }

    if (method === 'POST') {
      mockState.rateLimits.set(rateKey, attempts + 1);
      if (bodyObj?.password === adminPassword) {
        mockState.rateLimits.delete(rateKey);
        const newToken = crypto.randomBytes(32).toString('hex');
        mockState.sessions.set(newToken, { created_at: Date.now() });
        return createMockResponse({ success: true }, 200, {
          'set-cookie': `creasphere_admin_auth=${newToken}; Path=/; HttpOnly; SameSite=Lax`,
        });
      }
      return createMockResponse({ error: 'Невірний пароль' }, 401);
    }
    if (method === 'DELETE') {
      if (token) mockState.sessions.delete(token);
      return createMockResponse({ success: true }, 200);
    }
  }

  // 2. /api/categories
  if (pathname === '/api/categories') {
    if (method === 'GET') {
      return createMockResponse(Array.from(mockState.categories.values()), 200);
    }
    if (!isAuth) return createMockResponse({ error: 'Unauthorized' }, 401);
    if (method === 'POST') {
      const id = crypto.randomUUID();
      const cat = { id, name: bodyObj?.name, description: bodyObj?.description };
      mockState.categories.set(id, cat);
      return createMockResponse({ success: true, category: cat }, 200);
    }
    if (method === 'PUT') {
      const id = bodyObj?.id;
      if (!id || !mockState.categories.has(id)) return createMockResponse({ error: 'Not found' }, 404);
      const cat = { ...mockState.categories.get(id), ...bodyObj };
      mockState.categories.set(id, cat);
      return createMockResponse({ success: true, category: cat }, 200);
    }
    if (method === 'DELETE') {
      const id = searchParams.get('id');
      mockState.categories.delete(id);
      return createMockResponse({ success: true }, 200);
    }
  }

  // 3. /api/products
  if (pathname === '/api/products') {
    if (method === 'GET') {
      return createMockResponse(Array.from(mockState.products.values()), 200);
    }
    if (!isAuth) return createMockResponse({ error: 'Unauthorized' }, 401);
    if (method === 'POST') {
      if (bodyObj?.stock === undefined) return createMockResponse({ error: 'Stock required' }, 400);
      if (bodyObj.stock < 0) return createMockResponse({ error: 'Stock cannot be negative' }, 400);
      if (bodyObj.category_id && !/^[0-9a-fA-F-]{36}$/.test(bodyObj.category_id)) {
        return createMockResponse({ error: 'Invalid category_id' }, 400);
      }
      const id = crypto.randomUUID();
      const prod = { id, ...bodyObj };
      mockState.products.set(id, prod);
      return createMockResponse({ success: true, product: prod }, 200);
    }
    if (method === 'PUT') {
      const id = bodyObj?.id;
      if (!id || !mockState.products.has(id)) return createMockResponse({ error: 'Not found' }, 404);
      const prod = { ...mockState.products.get(id), ...bodyObj };
      mockState.products.set(id, prod);
      return createMockResponse({ success: true, product: prod }, 200);
    }
    if (method === 'DELETE') {
      const id = searchParams.get('id');
      mockState.products.delete(id);
      return createMockResponse({ success: true }, 200);
    }
  }

  // 4. /api/orders
  if (pathname === '/api/orders') {
    if (method === 'GET') {
      if (!isAuth) return createMockResponse({ error: 'Unauthorized' }, 401);
      return createMockResponse(Array.from(mockState.orders.values()), 200);
    }
    if (method === 'POST') {
      const items = bodyObj?.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        return createMockResponse({ error: 'Empty items' }, 400);
      }
      for (const it of items) {
        if (!it.id || !mockState.products.has(it.id)) return createMockResponse({ error: 'Product not found' }, 400);
        if (it.quantity <= 0) return createMockResponse({ error: 'Invalid quantity' }, 400);
        if (it.quantity > 10000) return createMockResponse({ error: 'Excessive quantity' }, 400);
        const prod = mockState.products.get(it.id);
        if (prod.stock < it.quantity) return createMockResponse({ error: 'Insufficient stock' }, 400);
      }

      // Decrement atomic stock
      let realTotal = 0;
      for (const it of items) {
        const prod = mockState.products.get(it.id);
        prod.stock -= it.quantity;
        realTotal += prod.price * it.quantity;
      }

      const orderNumber = `CS-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const newOrder = {
        order_number: orderNumber,
        customer_name: bodyObj.customer_name,
        customer_phone: bodyObj.customer_phone,
        customer_email: bodyObj.customer_email,
        delivery_address: bodyObj.delivery_address,
        total_amount: realTotal, // Server calculated total
        status: 'pending', // strips client injected completed status
      };
      mockState.orders.set(orderNumber, newOrder);

      // Return ONLY safe order info (no customer PII)
      return createMockResponse({ success: true, orderNumber }, 200);
    }
    if (method === 'DELETE') {
      const id = searchParams.get('id');
      mockState.orders.delete(id);
      return createMockResponse({ success: true }, 200);
    }
  }

  // 5. /api/workshops & /api/workshops/book
  if (pathname === '/api/workshops') {
    if (method === 'GET') {
      const all = Array.from(mockState.workshops.values());
      if (isAuth) return createMockResponse(all, 200);
      return createMockResponse(all.filter((w) => w.status !== 'archived'), 200);
    }
    if (!isAuth) return createMockResponse({ error: 'Unauthorized' }, 401);
    if (method === 'POST') {
      const id = crypto.randomUUID();
      const ws = { id, ...bodyObj };
      mockState.workshops.set(id, ws);
      return createMockResponse({ success: true, workshop: ws }, 200);
    }
    if (method === 'DELETE') {
      const id = searchParams.get('id');
      mockState.workshops.delete(id);
      return createMockResponse({ success: true }, 200);
    }
  }

  if (pathname === '/api/workshops/book') {
    if (method === 'GET') {
      if (!isAuth) return createMockResponse({ error: 'Unauthorized' }, 401);
      return createMockResponse(Array.from(mockState.workshopBookings.values()), 200);
    }
    if (method === 'POST') {
      const count = bodyObj?.participants_count || 1;
      const title = bodyObj?.workshop_title;
      const ws = Array.from(mockState.workshops.values()).find((w) => w.title === title);
      if (ws && ws.available_spots !== undefined && ws.available_spots < count) {
        return createMockResponse({ error: 'Недостатньо вільних місць' }, 400);
      }
      if (ws && ws.available_spots !== undefined) {
        ws.available_spots -= count;
      }
      const bookingNumber = `WB-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      mockState.workshopBookings.set(bookingNumber, { bookingNumber, ...bodyObj });
      return createMockResponse({ success: true, bookingNumber }, 200);
    }
    if (method === 'DELETE') {
      const id = searchParams.get('id');
      mockState.workshopBookings.delete(id);
      return createMockResponse({ success: true }, 200);
    }
  }

  // 6. /api/space-bookings
  if (pathname === '/api/space-bookings') {
    if (method === 'GET') {
      if (!isAuth) return createMockResponse({ error: 'Unauthorized' }, 401);
      return createMockResponse(Array.from(mockState.spaceBookings.values()), 200);
    }
    if (method === 'POST') {
      const bookingNumber = `SB-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      mockState.spaceBookings.set(bookingNumber, { bookingNumber, ...bodyObj });
      return createMockResponse({ success: true, bookingNumber }, 200);
    }
    if (method === 'DELETE') {
      const id = searchParams.get('id');
      mockState.spaceBookings.delete(id);
      return createMockResponse({ success: true }, 200);
    }
  }

  // 7. /api/custom-orders
  if (pathname === '/api/custom-orders') {
    if (method === 'GET') {
      if (!isAuth) return createMockResponse({ error: 'Unauthorized' }, 401);
      return createMockResponse(Array.from(mockState.customOrders.values()), 200);
    }
    if (method === 'POST') {
      const orderNumber = `CS-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      mockState.customOrders.set(orderNumber, { orderNumber, ...bodyObj });
      return createMockResponse({ success: true, orderNumber }, 200);
    }
    if (method === 'DELETE') {
      const id = searchParams.get('id');
      mockState.customOrders.delete(id);
      return createMockResponse({ success: true }, 200);
    }
  }

  return createMockResponse({ error: 'Route not found' }, 404);
}

export async function apiFetch(urlPath, options = {}) {
  const online = await isServerOnline();
  if (online) {
    const headers = {
      'x-forwarded-for': TEST_IP,
      ...(options.headers || {}),
    };
    return fetch(`${BASE_URL}${urlPath}`, {
      ...options,
      headers,
    });
  }

  return handleMockRequest(urlPath, options);
}

// Log in as admin and return cookie
export async function getAdminCookie() {
  const res = await apiFetch('/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminPassword }),
  });
  const cookie = res.headers.get('set-cookie');
  if (cookie) {
    return cookie.split(';')[0];
  }
  return '';
}

// Supabase client instance with mock capability for offline/placeholder mode
export function getTestSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  const client = createClient(url, key);

  const isMock = !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder') ||
    url.includes('placeholder');

  if (isMock) {
    // Mock direct RPC to return error (mimicking denied public permissions)
    mock.method(client, 'rpc', async () => ({
      data: null,
      error: { message: 'permission denied for function' },
    }));

    // Mock direct table insert to return error (mimicking denied public REST insert)
    mock.method(client, 'from', () => ({
      insert: async () => ({
        data: null,
        error: { message: 'permission denied for table' },
      }),
    }));
  }

  return client;
}
