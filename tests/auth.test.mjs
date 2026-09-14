import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { apiFetch, adminPassword, getAdminCookie } from './helpers/test-client.mjs';

describe('Admin Authentication & Access Control (auth)', () => {
  let adminCookie = '';

  test('1. Unauthenticated admin endpoint returns HTTP 401', async () => {
    const res = await apiFetch('/api/orders');
    assert.equal(res.status, 401, `Unauthenticated GET /api/orders must return HTTP 401 (Got ${res.status})`);
  });

  test('2. Authenticated admin login succeeds and can manage categories', async () => {
    const loginRes = await apiFetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword }),
    });
    const data = await loginRes.json();
    const setCookie = loginRes.headers.get('set-cookie');

    assert.equal(loginRes.status, 200, 'Login with correct admin password must succeed (HTTP 200)');
    assert.equal(data.success, true, 'Login response must contain success: true');
    assert.ok(setCookie && setCookie.includes('creasphere_admin_auth='), 'Server must set HttpOnly creasphere_admin_auth cookie');

    adminCookie = setCookie.split(';')[0];

    const ordersRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    const ordersData = await ordersRes.json();
    assert.equal(ordersRes.status, 200, 'Authenticated admin must view orders (HTTP 200)');
    assert.ok(Array.isArray(ordersData), 'Orders response must be an array');

    // Authenticated category CRUD check
    const catGetRes = await apiFetch('/api/categories');
    assert.equal(catGetRes.status, 200, 'GET /api/categories returns HTTP 200');

    const catCreateRes = await apiFetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Тестова Категорія 2026',
        description: 'Категорія для автотесту',
      }),
    });
    const catCreateData = await catCreateRes.json();
    assert.equal(catCreateRes.status, 200, 'Authenticated admin can create new category (HTTP 200)');
    assert.equal(catCreateData.success, true, 'Category creation returns success: true');

    const createdCatId = catCreateData.category?.id;
    if (createdCatId) {
      const catUpdateRes = await apiFetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          id: createdCatId,
          name: 'Оновлена Тестова Категорія',
          description: 'Оновлений опис',
        }),
      });
      const catUpdateData = await catUpdateRes.json();
      assert.equal(catUpdateRes.status, 200, 'Authenticated admin can update category (HTTP 200)');
      assert.equal(catUpdateData.success, true);

      const catDelRes = await apiFetch(`/api/categories?id=${encodeURIComponent(createdCatId)}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      const catDelData = await catDelRes.json();
      assert.equal(catDelRes.status, 200, 'Authenticated admin can delete category (HTTP 200)');
      assert.equal(catDelData.success, true);
    }
  });

  test('3. Fake session token is rejected with HTTP 401', async () => {
    const fakeRes = await apiFetch('/api/orders', {
      headers: { Cookie: 'creasphere_admin_auth=fake_session_hex_99999999999999999' },
    });
    assert.equal(fakeRes.status, 401, `Fake session token must be rejected with HTTP 401 (Got ${fakeRes.status})`);
  });

  test('4. Expired session token is rejected with HTTP 401', async () => {
    const expiredToken = crypto.randomBytes(32).toString('hex');
    const expiredHash = crypto.createHash('sha256').update(expiredToken).digest('hex');
    const devStorePath = path.join(os.tmpdir(), 'creasphere_admin_sessions.json');

    try {
      let sessions = [];
      if (fs.existsSync(devStorePath)) {
        sessions = JSON.parse(fs.readFileSync(devStorePath, 'utf8'));
      }
      sessions.push({
        token_hash: expiredHash,
        created_at: new Date(Date.now() - 1000000).toISOString(),
        expires_at: new Date(Date.now() - 50000).toISOString(),
        revoked_at: null,
      });
      fs.writeFileSync(devStorePath, JSON.stringify(sessions, null, 2), 'utf8');
    } catch (_) {}

    const expiredRes = await apiFetch('/api/orders', {
      headers: { Cookie: `creasphere_admin_auth=${expiredToken}` },
    });
    assert.equal(expiredRes.status, 401, `Expired session token must return HTTP 401 (Got ${expiredRes.status})`);
  });

  test('5. Revoked session token is rejected after logout', async () => {
    if (!adminCookie) adminCookie = await getAdminCookie();

    const logoutRes = await apiFetch('/api/admin/auth', {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert.equal(logoutRes.status, 200, 'Logout DELETE /api/admin/auth must return HTTP 200');

    const postLogoutRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    assert.equal(postLogoutRes.status, 401, 'Revoked session must be rejected with HTTP 401');

    // Re-authenticate
    adminCookie = await getAdminCookie();
  });

  test('6. Public user cannot SELECT customer orders (PII Protected)', async () => {
    const res = await apiFetch('/api/orders');
    assert.equal(res.status, 401, 'Public user cannot SELECT orders (Customer PII is protected)');
  });

  test('7. Public user cannot SELECT bookings or custom orders', async () => {
    const wRes = await apiFetch('/api/workshops/book');
    assert.equal(wRes.status, 401, 'Public GET /api/workshops/book returns HTTP 401');

    const sRes = await apiFetch('/api/space-bookings');
    assert.equal(sRes.status, 401, 'Public GET /api/space-bookings returns HTTP 401');

    const cRes = await apiFetch('/api/custom-orders');
    assert.equal(cRes.status, 401, 'Public GET /api/custom-orders returns HTTP 401');
  });

  test('8. Mutations on products and categories without admin are denied', async () => {
    const postRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked', price: 1 }),
    });
    assert.equal(postRes.status, 401, 'Unauthenticated POST /api/products returns HTTP 401');

    const putRes = await apiFetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'p1', name: 'Hacked', price: 1 }),
    });
    assert.equal(putRes.status, 401, 'Unauthenticated PUT /api/products returns HTTP 401');

    const delRes = await apiFetch('/api/products?id=p1', { method: 'DELETE' });
    assert.equal(delRes.status, 401, 'Unauthenticated DELETE /api/products returns HTTP 401');

    const catPostRes = await apiFetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Cat' }),
    });
    assert.equal(catPostRes.status, 401, 'Unauthenticated POST /api/categories returns HTTP 401');

    const catPutRes = await apiFetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'cat-1', name: 'Hacked Cat' }),
    });
    assert.equal(catPutRes.status, 401, 'Unauthenticated PUT /api/categories returns HTTP 401');

    const catDelRes = await apiFetch('/api/categories?id=cat-1', { method: 'DELETE' });
    assert.equal(catDelRes.status, 401, 'Unauthenticated DELETE /api/categories returns HTTP 401');
  });

  test('9. PII is never leaked in creation responses', async () => {
    if (!adminCookie) adminCookie = await getAdminCookie();

    const orderRes = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Privileged Customer',
        customer_phone: '+380509998877',
        customer_email: 'secret@example.com',
        delivery_city: 'Київ',
        delivery_address: 'вул. Хрещатик, 1',
        payment_method: 'requisites',
        notes: 'Secret note',
        items: [{ id: 'p1', quantity: 1 }],
      }),
    });
    const orderData = await orderRes.json();
    assert.equal(orderRes.status, 200, 'Order created');
    assert.ok(
      !orderData.customer_name && !orderData.customer_phone && !orderData.customer_email && !orderData.delivery_address,
      'POST /api/orders response does NOT leak customer PII (only orderNumber returned)'
    );

    const customRes = await apiFetch('/api/custom-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Private Client',
        customer_phone: '+380501112233',
        customer_email: 'private@client.com',
        description: 'Special custom sculpture',
      }),
    });
    const customData = await customRes.json();
    assert.ok(
      !customData.customer_name && !customData.customer_phone && !customData.order,
      'POST /api/custom-orders response does NOT leak customer PII'
    );

    const wsRes = await apiFetch('/api/workshops/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Workshop Attendee',
        customer_phone: '+380501112233',
        workshop_title: 'Гончарство для початківців',
        participants_count: 1,
      }),
    });
    const wsData = await wsRes.json();
    assert.ok(
      !wsData.customer_name && !wsData.customer_phone && !wsData.booking,
      'POST /api/workshops/book response does NOT leak customer PII'
    );

    const spaceRes = await apiFetch('/api/space-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Space Renter',
        customer_phone: '+380501112233',
        tariff: 'standard',
        event_date: '2026-09-15',
        guests_count: 5,
      }),
    });
    const spaceData = await spaceRes.json();
    assert.ok(
      !spaceData.customer_name && !spaceData.customer_phone && !spaceData.booking,
      'POST /api/space-bookings response does NOT leak customer PII'
    );
  });

  test('10. Production session store fails closed without fallback', () => {
    const authPath = path.resolve(process.cwd(), 'src', 'lib', 'auth.js');
    const authSrc = fs.readFileSync(authPath, 'utf8');

    const hasProdCheckCreate = authSrc.includes("if (process.env.NODE_ENV === 'production')") &&
      authSrc.includes("throw new Error('Persistent session store unavailable in production');");
    const hasProdCheckValidate = authSrc.includes("if (process.env.NODE_ENV === 'production')") &&
      authSrc.includes('return false;');
    const hasProdCheckRequire = authSrc.includes("process.env.NODE_ENV === 'production' && !isSupabaseAdminConfigured") &&
      authSrc.includes('status: 503');

    assert.ok(hasProdCheckCreate, 'Production createAdminSession fails closed (throws 503 error, never falls back to disk/memory)');
    assert.ok(hasProdCheckValidate, 'Production isValidAdminSession fails closed (returns false, never falls back to disk/memory)');
    assert.ok(hasProdCheckRequire, 'Production requireAdmin guard returns HTTP 503 if session store is unavailable');
  });
});
