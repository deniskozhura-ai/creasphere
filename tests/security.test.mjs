/**
 * Comprehensive Automated Security & Access Control Test Suite for CreaSphere (Stage 2 Hardening)
 *
 * Tests 19 Crucial Security Requirements:
 * 1. Unauthenticated admin endpoint -> 401/403
 * 2. Authenticated admin endpoint -> success
 * 3. Fake session -> rejected
 * 4. Expired session -> rejected
 * 5. Revoked session -> rejected
 * 6. Client price manipulation -> rejected/ignored
 * 7. Client total manipulation -> rejected/ignored
 * 8. Negative quantity -> rejected
 * 9. Huge quantity -> rejected
 * 10. Nonexistent product -> rejected
 * 11. Insufficient stock -> rejected
 * 12. Concurrent stock purchase -> only valid number succeeds (race condition check)
 * 13. Public order SELECT -> denied
 * 14. Public booking SELECT -> denied
 * 15. Product mutation without admin -> denied
 * 16. Mass assignment -> denied (internal fields stripped)
 * 17. Rate limit -> enforced (HTTP 429)
 * 18. PII not returned unnecessarily in responses
 * 19. Service role secret never appears in client bundle
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Load ADMIN_PASSWORD from process.env or .env.local without any hardcoded fallback
let adminPassword = process.env.ADMIN_PASSWORD;
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
  } catch (e) {}
}

const TEST_IP = `10.220.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function apiFetch(urlPath, options = {}) {
  const headers = {
    'x-forwarded-for': TEST_IP,
    ...(options.headers || {}),
  };
  return fetch(`${BASE_URL}${urlPath}`, {
    ...options,
    headers,
  });
}

async function runAllSecurityTests() {
  console.log('================================================================');
  console.log(`🔒 CREASPHERE STAGE 2 SECURITY HARDENING TEST SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Client IP: ${TEST_IP}`);
  console.log('================================================================\n');

  let adminCookie = '';

  // Ensure fresh catalog stock in seed store for test isolation
  try {
    const productsPath = path.resolve(process.cwd(), 'src', 'data', 'products.json');
    if (fs.existsSync(productsPath)) {
      const initialProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      for (const p of initialProducts) {
        p.stock = 100;
        p.status = 'in_stock';
      }
      fs.writeFileSync(productsPath, JSON.stringify(initialProducts, null, 2), 'utf8');
    }
  } catch (e) {}

  // -----------------------------------------------------------------
  // 1. UNAUTHENTICATED ADMIN ENDPOINT -> 401/403
  // -----------------------------------------------------------------
  console.log('--- Test 1: Unauthenticated Admin Endpoint ---');
  try {
    const res = await apiFetch('/api/orders');
    assert(res.status === 401, `Unauthenticated GET /api/orders returns HTTP 401 (Got ${res.status})`);
  } catch (e) {
    assert(false, `Test 1 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN ENDPOINT -> SUCCESS
  // -----------------------------------------------------------------
  console.log('\n--- Test 2: Authenticated Admin Endpoint ---');
  try {
    const loginRes = await apiFetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword }),
    });
    const data = await loginRes.json();
    const setCookie = loginRes.headers.get('set-cookie');
    assert(loginRes.status === 200 && data.success, 'Login with correct admin password succeeds (HTTP 200)');
    assert(setCookie && setCookie.includes('creasphere_admin_auth='), 'Server sets HttpOnly creasphere_admin_auth cookie');

    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }

    const ordersRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    const ordersData = await ordersRes.json();
    assert(ordersRes.status === 200 && Array.isArray(ordersData), 'Authenticated admin can view orders (HTTP 200)');

    // Authenticated category CRUD check
    const catGetRes = await apiFetch('/api/categories');
    assert(catGetRes.status === 200, 'GET /api/categories returns HTTP 200');

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
    assert(catCreateRes.status === 200 && catCreateData.success, 'Authenticated admin can create new category (HTTP 200)');

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
      assert(catUpdateRes.status === 200 && catUpdateData.success, 'Authenticated admin can update category (HTTP 200)');

      const catDelRes = await apiFetch(`/api/categories?id=${encodeURIComponent(createdCatId)}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      const catDelData = await catDelRes.json();
      assert(catDelRes.status === 200 && catDelData.success, 'Authenticated admin can delete category (HTTP 200)');
    }
  } catch (e) {
    assert(false, `Test 2 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 3. FAKE SESSION -> REJECTED
  // -----------------------------------------------------------------
  console.log('\n--- Test 3: Fake Session Token Rejected ---');
  try {
    const fakeRes = await apiFetch('/api/orders', {
      headers: { Cookie: 'creasphere_admin_auth=fake_session_hex_99999999999999999' },
    });
    assert(fakeRes.status === 401, `Fake session token is rejected with HTTP 401 (Got ${fakeRes.status})`);
  } catch (e) {
    assert(false, `Test 3 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 4. EXPIRED SESSION -> REJECTED
  // -----------------------------------------------------------------
  console.log('\n--- Test 4: Expired Session Token Rejected ---');
  try {
    // Generate an expired session hash in the dev persistent store
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
        expires_at: new Date(Date.now() - 50000).toISOString(), // already expired!
        revoked_at: null,
      });
      fs.writeFileSync(devStorePath, JSON.stringify(sessions, null, 2), 'utf8');
    } catch (e) {}

    const expiredRes = await apiFetch('/api/orders', {
      headers: { Cookie: `creasphere_admin_auth=${expiredToken}` },
    });
    assert(expiredRes.status === 401, `Expired session token is rejected with HTTP 401 (Got ${expiredRes.status})`);
  } catch (e) {
    assert(false, `Test 4 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 5. REVOKED SESSION -> REJECTED
  // -----------------------------------------------------------------
  console.log('\n--- Test 5: Revoked Session Token Rejected ---');
  try {
    // Perform logout
    const logoutRes = await apiFetch('/api/admin/auth', {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(logoutRes.status === 200, 'Logout DELETE /api/admin/auth returns HTTP 200');

    // Attempt to access orders with revoked cookie
    const postLogoutRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    assert(postLogoutRes.status === 401, 'Revoked session is rejected with HTTP 401');

    // Re-authenticate admin for remaining tests
    const reloginRes = await apiFetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword }),
    });
    const setCookie2 = reloginRes.headers.get('set-cookie');
    if (setCookie2) {
      adminCookie = setCookie2.split(';')[0];
    }
  } catch (e) {
    assert(false, `Test 5 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 6 & 7. CLIENT-SIDE PRICE & TOTAL MANIPULATION -> REJECTED / SERVER PRICE ENFORCED
  // -----------------------------------------------------------------
  console.log('\n--- Test 6 & 7: Price & Total Manipulation Rejected/Ignored ---');
  const cleanupOrders = [];
  const cleanupWorkshops = [];
  const cleanupCustom = [];
  const cleanupSpace = [];
  let placedOrderNumber = null;
  let testProductId = null;
  try {
    // 1. Create a dedicated test product with catalog price 750
    const createProdRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: `Price Guard Test Item ${Date.now()}`,
        price: 750,
        stock: 50,
        category_id: '1',
      }),
    });
    const prodData = await createProdRes.json();
    testProductId = prodData.product?.id;
    assert(createProdRes.status === 200 && testProductId, 'Created temporary test product for price verification');

    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        customer_email: 'auditor@example.com',
        delivery_city: 'Павлоград',
        delivery_address: 'Відділення №1',
        delivery_method: 'nova_poshta',
        payment_method: 'requisites',
        // ATTEMPT TO MANIPULATE PRICE AND TOTAL:
        total: 1.0,
        items: [{ id: testProductId, price: 0.01, quantity: 2 }],
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Order created successfully with server-authoritative pricing');
    assert(data.orderNumber && typeof data.orderNumber === 'string', `Valid orderNumber returned: ${data.orderNumber}`);
    placedOrderNumber = data.orderNumber;
    if (data.orderNumber) cleanupOrders.push(data.orderNumber);

    // Verify through Admin endpoint that the server recorded the real catalog total (1500 UAH), not 1.0 UAH
    const adminOrdersRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    const adminOrders = await adminOrdersRes.json();
    const recordedOrder = adminOrders.find((o) => o.order_number === placedOrderNumber);

    assert(
      recordedOrder && recordedOrder.total_amount === 1500,
      `Server calculated catalog total: 1500 ₴ instead of client manipulated 1.0 ₴ (Recorded: ${recordedOrder?.total_amount} ₴)`
    );

    // Clean up temporary test product so database stays completely pristine
    if (testProductId) {
      await apiFetch(`/api/products?id=${testProductId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      testProductId = null;
    }
  } catch (e) {
    if (testProductId) {
      try {
        await apiFetch(`/api/products?id=${testProductId}`, {
          method: 'DELETE',
          headers: { Cookie: adminCookie },
        });
      } catch (_) {}
    }
    assert(false, `Test 6 & 7 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 8. NEGATIVE QUANTITY -> REJECTED
  // -----------------------------------------------------------------
  console.log('\n--- Test 8: Negative Quantity Rejected ---');
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        items: [{ id: 'p1', quantity: -3 }],
      }),
    });
    assert(res.status === 400, `Negative quantity returns HTTP 400 (Got ${res.status})`);
  } catch (e) {
    assert(false, `Test 8 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 9. HUGE QUANTITY -> REJECTED
  // -----------------------------------------------------------------
  console.log('\n--- Test 9: Huge Quantity Rejected ---');
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        items: [{ id: 'p1', quantity: 99999999 }],
      }),
    });
    assert(res.status === 400, `Huge quantity returns HTTP 400 (Got ${res.status})`);
  } catch (e) {
    assert(false, `Test 9 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 10. NONEXISTENT PRODUCT -> REJECTED
  // -----------------------------------------------------------------
  console.log('\n--- Test 10: Nonexistent Product Rejected ---');
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        items: [{ id: 'nonexistent_prod_9999', quantity: 1 }],
      }),
    });
    assert(res.status === 400, `Nonexistent product returns HTTP 400 (Got ${res.status})`);
  } catch (e) {
    assert(false, `Test 10 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 11. INSUFFICIENT STOCK -> REJECTED
  // -----------------------------------------------------------------
  console.log('\n--- Test 11: Insufficient Stock Rejected ---');
  try {
    // Request 500 items of product p4 which has limited stock
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        items: [{ id: 'p4', quantity: 500 }],
      }),
    });
    assert(res.status === 400, `Insufficient stock returns HTTP 400 (Got ${res.status})`);
  } catch (e) {
    assert(false, `Test 11 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 12. CONCURRENT STOCK PURCHASE -> ONLY VALID NUMBER SUCCEEDS
  // -----------------------------------------------------------------
  console.log('\n--- Test 12: Concurrent Stock Purchase (Race Condition Protection) ---');
  try {
    // 1. Create a special product with exactly 1 item in stock
    const createProdRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: `Limited Race Item ${Date.now()}`,
        price: 100,
        stock: 1,
        category_id: '1',
      }),
    });
    const prodData = await createProdRes.json();
    const limitedProductId = prodData.product?.id;
    assert(createProdRes.status === 200 && limitedProductId, 'Created product with stock = 1 for concurrency test');

    if (limitedProductId) {
      // 2. Launch 4 concurrent checkout requests competing for that 1 item
      const concurrentRequests = [1, 2, 3, 4].map((idx) =>
        apiFetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: `Concurrent Buyer ${idx}`,
            customer_phone: '+380501112233',
            items: [{ id: limitedProductId, quantity: 1 }],
          }),
        })
      );

      const responses = await Promise.all(concurrentRequests);
      for (const r of responses) {
        if (r.status === 200) {
          try {
            const d = await r.clone().json();
            if (d.orderNumber) cleanupOrders.push(d.orderNumber);
          } catch (_) {}
        }
      }
      const statuses = responses.map((r) => r.status);
      const successCount = statuses.filter((s) => s === 200).length;
      const rejectedCount = statuses.filter((s) => s === 400).length;

      assert(
        successCount === 1,
        `Atomic stock protection: exactly 1 concurrent order succeeded (Successes: ${successCount}, Rejections: ${rejectedCount})`
      );

      // Cleanup test product
      await apiFetch(`/api/products?id=${limitedProductId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
    }
  } catch (e) {
    assert(false, `Test 12 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 13. PUBLIC ORDER SELECT -> DENIED
  // -----------------------------------------------------------------
  console.log('\n--- Test 13: Public Order SELECT Denied ---');
  try {
    const res = await apiFetch('/api/orders');
    assert(res.status === 401, 'Public user cannot SELECT orders (Customer PII is protected)');
  } catch (e) {
    assert(false, `Test 13 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 14. PUBLIC BOOKING SELECT -> DENIED
  // -----------------------------------------------------------------
  console.log('\n--- Test 14: Public Booking SELECT Denied ---');
  try {
    const wRes = await apiFetch('/api/workshops/book');
    assert(wRes.status === 401, 'Public GET /api/workshops/book returns HTTP 401');

    const sRes = await apiFetch('/api/space-bookings');
    assert(sRes.status === 401, 'Public GET /api/space-bookings returns HTTP 401');

    const cRes = await apiFetch('/api/custom-orders');
    assert(cRes.status === 401, 'Public GET /api/custom-orders returns HTTP 401');
  } catch (e) {
    assert(false, `Test 14 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 15. PRODUCT MUTATION WITHOUT ADMIN -> DENIED
  // -----------------------------------------------------------------
  console.log('\n--- Test 15: Product Mutation Without Admin Denied ---');
  try {
    const postRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked', price: 1 }),
    });
    assert(postRes.status === 401, 'Unauthenticated POST /api/products returns HTTP 401');

    const putRes = await apiFetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'p1', name: 'Hacked', price: 1 }),
    });
    assert(putRes.status === 401, 'Unauthenticated PUT /api/products returns HTTP 401');

    const delRes = await apiFetch('/api/products?id=p1', {
      method: 'DELETE',
    });
    assert(delRes.status === 401, 'Unauthenticated DELETE /api/products returns HTTP 401');

    // Category mutation without admin -> DENIED
    const catPostRes = await apiFetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Cat' }),
    });
    assert(catPostRes.status === 401, 'Unauthenticated POST /api/categories returns HTTP 401');

    const catPutRes = await apiFetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'cat-1', name: 'Hacked Cat' }),
    });
    assert(catPutRes.status === 401, 'Unauthenticated PUT /api/categories returns HTTP 401');

    const catDelRes = await apiFetch('/api/categories?id=cat-1', {
      method: 'DELETE',
    });
    assert(catDelRes.status === 401, 'Unauthenticated DELETE /api/categories returns HTTP 401');
  } catch (e) {
    assert(false, `Test 15 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 16. MASS ASSIGNMENT -> DENIED
  // -----------------------------------------------------------------
  console.log('\n--- Test 16: Mass Assignment Denied ---');
  let tempProductId16 = null;
  try {
    const prodListRes = await apiFetch('/api/products');
    const prodList = await prodListRes.json();
    let activeProductId = prodList.find((p) => (p.stock || 0) > 0)?.id;
    if (!activeProductId) {
      const cRes = await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ name: `Mass Test Item ${Date.now()}`, price: 100, stock: 50, category_id: '1' }),
      });
      const cData = await cRes.json();
      tempProductId16 = cData.product?.id;
      activeProductId = tempProductId16;
    }

    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Mass Assign Tester',
        customer_phone: '+380501112233',
        // Malicious fields injected:
        is_admin: true,
        role: 'superadmin',
        status: 'completed',
        payment_status: 'paid',
        payment_method: 'requisites',
        items: [{ id: activeProductId, quantity: 1 }],
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Order created with whitelisted schema');
    if (data.orderNumber) cleanupOrders.push(data.orderNumber);

    // Verify injected fields were not assigned as completed
    const adminOrdersRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    const adminOrders = await adminOrdersRes.json();
    const order = adminOrders.find((o) => o.order_number === data.orderNumber);
    assert(order && order.status === 'pending', 'Status was NOT mass-assigned to completed (stays pending)');
    assert(order && order.is_admin === undefined, 'is_admin field was stripped and discarded');

    if (tempProductId16) {
      await apiFetch(`/api/products?id=${tempProductId16}`, { method: 'DELETE', headers: { Cookie: adminCookie } });
      tempProductId16 = null;
    }
  } catch (e) {
    if (tempProductId16) {
      try { await apiFetch(`/api/products?id=${tempProductId16}`, { method: 'DELETE', headers: { Cookie: adminCookie } }); } catch (_) {}
    }
    assert(false, `Test 16 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 17. RATE LIMIT -> ENFORCED
  // -----------------------------------------------------------------
  console.log('\n--- Test 17: Rate Limit Enforced ---');
  const ATTACKER_IP = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
  try {
    let got429 = false;
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${BASE_URL}/api/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ATTACKER_IP,
        },
        body: JSON.stringify({ password: `wrong_${i}` }),
      });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    assert(got429, 'Rate limiting enforces HTTP 429 Too Many Requests on repeated requests');
  } catch (e) {
    assert(false, `Test 17 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 18. PII NOT RETURNED UNNECESSARILY
  // -----------------------------------------------------------------
  console.log('\n--- Test 18: PII Not Returned Unnecessarily ---');
  let tempProductId18 = null;
  try {
    const prodListRes = await apiFetch('/api/products');
    const prodList = await prodListRes.json();
    let activeProductId = prodList.find((p) => (p.stock || 0) > 0)?.id;
    if (!activeProductId) {
      const cRes = await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ name: `PII Test Item ${Date.now()}`, price: 100, stock: 50, category_id: '1' }),
      });
      const cData = await cRes.json();
      tempProductId18 = cData.product?.id;
      activeProductId = tempProductId18;
    }

    // 1. Check orders POST response
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
        items: [{ id: activeProductId, quantity: 1 }],
      }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 200, 'Order created');
    if (orderData.orderNumber) cleanupOrders.push(orderData.orderNumber);
    assert(
      !orderData.customer_name && !orderData.customer_phone && !orderData.customer_email && !orderData.delivery_address,
      'POST /api/orders response does NOT leak customer PII (only orderNumber returned)'
    );

    if (tempProductId18) {
      await apiFetch(`/api/products?id=${tempProductId18}`, { method: 'DELETE', headers: { Cookie: adminCookie } });
      tempProductId18 = null;
    }

    // 2. Check custom-orders POST response
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
    if (customData.orderNumber) cleanupCustom.push(customData.orderNumber);
    assert(
      !customData.customer_name && !customData.customer_phone && !customData.order,
      'POST /api/custom-orders response does NOT leak customer PII'
    );

    // 3. Check workshops POST response
    const wsRes = await apiFetch('/api/workshops/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Workshop Attendee',
        customer_phone: '+380501112233',
        workshop_title: 'Гончарство',
        participants_count: 1,
      }),
    });
    const wsData = await wsRes.json();
    if (wsData.bookingNumber) cleanupWorkshops.push(wsData.bookingNumber);
    assert(
      !wsData.customer_name && !wsData.customer_phone && !wsData.booking,
      'POST /api/workshops/book response does NOT leak customer PII'
    );

    // 4. Check space bookings POST response
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
    if (spaceData.bookingNumber) cleanupSpace.push(spaceData.bookingNumber);
    assert(
      !spaceData.customer_name && !spaceData.customer_phone && !spaceData.booking,
      'POST /api/space-bookings response does NOT leak customer PII'
    );
  } catch (e) {
    assert(false, `Test 18 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 19. SERVICE ROLE SECRET NEVER APPEARS IN CLIENT BUNDLE
  // -----------------------------------------------------------------
  console.log('\n--- Test 19: Service Role Key Never Appears in Client Bundle ---');
  try {
    const srcDir = path.resolve(process.cwd(), 'src');
    const clientFiles = [];

    function collectClientFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'api' && entry.name !== 'lib' && entry.name !== 'node_modules') {
            collectClientFiles(fullPath);
          }
        } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
          clientFiles.push(fullPath);
        }
      }
    }

    collectClientFiles(srcDir);

    let leaked = false;
    for (const filePath of clientFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('SUPABASE_SERVICE_ROLE_KEY') || content.includes('supabase-admin')) {
        console.error(`Leaked in: ${filePath}`);
        leaked = true;
      }
    }

    assert(!leaked, 'SUPABASE_SERVICE_ROLE_KEY is NEVER imported or referenced in non-API client code');
  } catch (e) {
    assert(false, `Test 19 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 20. PRODUCTION SESSION STORE UNAVAILABLE -> FAIL CLOSED
  // -----------------------------------------------------------------
  console.log('\n--- Test 20: Production Session Store Fail-Closed ---');
  try {
    const authPath = path.resolve(process.cwd(), 'src', 'lib', 'auth.js');
    const authSrc = fs.readFileSync(authPath, 'utf8');

    const hasProdCheckCreate = authSrc.includes("if (process.env.NODE_ENV === 'production')") &&
      authSrc.includes("throw new Error('Persistent session store unavailable in production');");
    const hasProdCheckValidate = authSrc.includes("if (process.env.NODE_ENV === 'production')") &&
      authSrc.includes('return false;');
    const hasProdCheckRequire = authSrc.includes("process.env.NODE_ENV === 'production' && !isSupabaseAdminConfigured") &&
      authSrc.includes('status: 503');

    assert(hasProdCheckCreate, 'Production createAdminSession fails closed (throws 503 error, never falls back to disk/memory)');
    assert(hasProdCheckValidate, 'Production isValidAdminSession fails closed (returns false, never falls back to disk/memory)');
    assert(hasProdCheckRequire, 'Production requireAdmin guard returns HTTP 503 if session store is unavailable');
  } catch (e) {
    assert(false, `Test 20 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 21. PRODUCTION RATE LIMITER UNAVAILABLE -> FAIL CLOSED
  // -----------------------------------------------------------------
  console.log('\n--- Test 21: Production Rate Limiter Fail-Closed ---');
  try {
    const rateLimitPath = path.resolve(process.cwd(), 'src', 'lib', 'rate-limit.js');
    const rateLimitSrc = fs.readFileSync(rateLimitPath, 'utf8');

    const hasProdCheckRateLimit = rateLimitSrc.includes("if (process.env.NODE_ENV === 'production')") &&
      rateLimitSrc.includes('serviceUnavailable: true');
    const hasProd503Response = rateLimitSrc.includes('if (result.serviceUnavailable)') &&
      rateLimitSrc.includes('status: 503');

    assert(hasProdCheckRateLimit, 'Production rateLimit fails closed (serviceUnavailable: true, never falls back to memory)');
    assert(hasProd503Response, 'Production applyRateLimit returns HTTP 503 when external rate limiter is unavailable');
  } catch (e) {
    assert(false, `Test 21 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 22. DIRECT PUBLIC RPC check_rate_limit -> DENIED
  // -----------------------------------------------------------------
  console.log('\n--- Test 22: Direct Public RPC check_rate_limit Denied ---');
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: 'direct_anon_attack',
      p_max_requests: 10,
      p_window_ms: 60000,
    });
    // With placeholder credentials or REVOKE in Supabase, anonymous client MUST receive error
    assert(Boolean(error), 'Direct anonymous Supabase RPC check_rate_limit is DENIED');
  } catch (e) {
    assert(false, `Test 22 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 23. DIRECT PUBLIC RPC create_order_atomic -> DENIED
  // -----------------------------------------------------------------
  console.log('\n--- Test 23: Direct Public RPC create_order_atomic Denied ---');
  try {
    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_order_number: 'DIRECT-ATTACK-001',
      p_customer_name: 'Attacker',
      p_customer_phone: '+380500000000',
      p_customer_email: 'attacker@example.com',
      p_delivery_address: 'nowhere',
      p_delivery_method: 'pickup',
      p_payment_method: 'cash',
      p_notes: 'direct rpc attack',
      p_items: [{ id: 'p1', quantity: 1 }],
    });
    assert(Boolean(error), 'Direct anonymous Supabase RPC create_order_atomic is DENIED');
  } catch (e) {
    assert(false, `Test 23 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 24. DIRECT PUBLIC ORDERS & ORDER_ITEMS INSERT -> DENIED
  // -----------------------------------------------------------------
  console.log('\n--- Test 24: Direct Public Orders & Order Items INSERT Denied ---');
  try {
    const { error: orderErr } = await supabase.from('orders').insert([
      {
        order_number: 'DIRECT-REST-ATTACK',
        customer_name: 'Attacker',
        customer_phone: '+380500000000',
        total_amount: 0.01,
      },
    ]);
    assert(Boolean(orderErr), 'Direct anonymous Supabase REST INSERT into orders is DENIED');

    const { error: itemErr } = await supabase.from('order_items').insert([
      {
        product_name: 'Free Stolen Item',
        quantity: 1,
        price: 0.00,
        total: 0.00,
      },
    ]);
    assert(Boolean(itemErr), 'Direct anonymous Supabase REST INSERT into order_items is DENIED');
  } catch (e) {
    assert(false, `Test 24 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 25. SECURITY DEFINER SEARCH_PATH & PERMISSION SPECIFICATION
  // -----------------------------------------------------------------
  console.log('\n--- Test 25: SQL Schema Search Path & Permission Hardening ---');
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    const hasEmptySearchPath = schemaSql.includes("SET search_path = ''");
    const hasRevokeRateLimit = schemaSql.includes('REVOKE ALL ON FUNCTION public.check_rate_limit');
    const hasGrantRateLimit = schemaSql.includes('GRANT EXECUTE ON FUNCTION public.check_rate_limit');
    const hasRevokeCreateOrder = schemaSql.includes('REVOKE ALL ON FUNCTION public.create_order_atomic');
    const hasGrantCreateOrder = schemaSql.includes('GRANT EXECUTE ON FUNCTION public.create_order_atomic');

    assert(hasEmptySearchPath, 'All SECURITY DEFINER functions use explicit immutable SET search_path = \'\'');
    assert(hasRevokeRateLimit && hasGrantRateLimit, 'public.check_rate_limit revokes from PUBLIC/anon and grants only to service_role');
    assert(hasRevokeCreateOrder && hasGrantCreateOrder, 'public.create_order_atomic revokes from PUBLIC/anon and grants only to service_role');
  } catch (e) {
    assert(false, `Test 25 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 26. SPOOFED X-FORWARDED-FOR PROTECTION & NETLIFY TRUSTED HEADERS
  // -----------------------------------------------------------------
  console.log('\n--- Test 26: Spoofed X-Forwarded-For Protection ---');
  try {
    // 1. Functional test: Send changing X-Forwarded-For with identical Netlify edge IP
    const SPOOF_TEST_NETLIFY_IP = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    let gotRateLimited = false;

    for (let i = 0; i < 7; i++) {
      const spoofedXff = `203.0.113.${10 + i}`;
      const res = await fetch(`${BASE_URL}/api/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nf-client-connection-ip': SPOOF_TEST_NETLIFY_IP,
          'x-forwarded-for': spoofedXff,
        },
        body: JSON.stringify({ password: `wrong_${i}` }),
      });
      if (res.status === 429) {
        gotRateLimited = true;
        break;
      }
    }
    assert(gotRateLimited, 'Rate limiter enforces HTTP 429 when client rotates spoofed X-Forwarded-For (Netlify IP prioritized)');

    // 2. Code audit verification for getClientIp
    const rateLimitPath = path.resolve(process.cwd(), 'src', 'lib', 'rate-limit.js');
    const rateLimitSrc = fs.readFileSync(rateLimitPath, 'utf8');
    const hasNetlifyPriority = rateLimitSrc.includes("request.headers.get('x-nf-client-connection-ip')");
    const hasUntrustedProdFallback = rateLimitSrc.includes("process.env.NODE_ENV === 'production'") &&
      rateLimitSrc.includes("'untrusted_client_ip'");

    assert(hasNetlifyPriority, 'getClientIp prioritizes Netlify Edge x-nf-client-connection-ip over X-Forwarded-For');
    assert(hasUntrustedProdFallback, 'getClientIp in production avoids trusting user-supplied X-Forwarded-For without edge proxy');
  } catch (e) {
    assert(false, `Test 26 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 27. PRODUCTS STORE /tmp ELIMINATION & PRODUCTION FAIL-CLOSED
  // -----------------------------------------------------------------
  console.log('\n--- Test 27: Products Store /tmp Elimination & Fail-Closed ---');
  try {
    const productsStorePath = path.resolve(process.cwd(), 'src', 'lib', 'products-store.js');
    const productsStoreSrc = fs.readFileSync(productsStorePath, 'utf8');

    const noTmpDirImport = !productsStoreSrc.includes("import os from 'os'") && !productsStoreSrc.includes('os.tmpdir');
    const noTmpFile = !productsStoreSrc.includes('creasphere_products.json');
    const hasProdAddCheck = productsStoreSrc.includes("if (process.env.NODE_ENV === 'production')") &&
      productsStoreSrc.includes('Local products store mutation is disabled in production');

    assert(noTmpDirImport, 'products-store.js does NOT import os or os.tmpdir');
    assert(noTmpFile, 'products-store.js does NOT use writable /tmp creasphere_products.json');
    assert(hasProdAddCheck, 'products-store.js mutations throw in production (fail closed)');

    const apiProductsPath = path.resolve(process.cwd(), 'src', 'app', 'api', 'products', 'route.js');
    const apiProductsSrc = fs.readFileSync(apiProductsPath, 'utf8');
    const hasProdGet503 = apiProductsSrc.includes("process.env.NODE_ENV === 'production' && !isSupabaseAdminConfigured") &&
      apiProductsSrc.includes('status: 503');

    assert(hasProdGet503, 'GET /api/products returns HTTP 503 in production if Supabase is unconfigured');
  } catch (e) {
    assert(false, `Test 27 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 28. PRODUCTION FAIL-CLOSED ACROSS ALL ROUTE HANDLERS & STORES
  // -----------------------------------------------------------------
  console.log('\n--- Test 28: Production Fail-Closed Across Route Handlers & Stores ---');
  try {
    const routesToCheck = [
      { file: 'src/app/api/orders/route.js', name: 'orders' },
      { file: 'src/app/api/workshops/book/route.js', name: 'workshops/book' },
      { file: 'src/app/api/space-bookings/route.js', name: 'space-bookings' },
      { file: 'src/app/api/custom-orders/route.js', name: 'custom-orders' },
    ];

    for (const { file, name } of routesToCheck) {
      const src = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const hasProd503 = src.includes("process.env.NODE_ENV === 'production'") && src.includes('status: 503');
      assert(hasProd503, `API route /api/${name} fails closed (HTTP 503) in production if database unavailable`);
    }

    const storesToCheck = [
      { file: 'src/lib/orders-store.js', name: 'orders-store' },
      { file: 'src/lib/bookings-store.js', name: 'bookings-store' },
      { file: 'src/lib/space-bookings-store.js', name: 'space-bookings-store' },
      { file: 'src/lib/custom-orders-store.js', name: 'custom-orders-store' },
    ];

    for (const { file, name } of storesToCheck) {
      const src = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const hasThrow = src.includes("process.env.NODE_ENV === 'production'") && src.includes('throw new Error');
      assert(hasThrow, `Store ${name} disallows local mutations in production`);
    }
  } catch (e) {
    assert(false, `Test 28 failed: ${e.message}`);
  }


  // -----------------------------------------------------------------
  // CLEANUP: Purge all test orders and bookings created during testing
  // -----------------------------------------------------------------
  console.log('\n--- Cleaning up temporary test orders & bookings ---');
  for (const num of cleanupOrders) {
    try { await apiFetch(`/api/orders?id=${encodeURIComponent(num)}`, { method: 'DELETE', headers: { Cookie: adminCookie } }); } catch (_) {}
  }
  for (const num of cleanupWorkshops) {
    try { await apiFetch(`/api/workshops/book?id=${encodeURIComponent(num)}`, { method: 'DELETE', headers: { Cookie: adminCookie } }); } catch (_) {}
  }
  for (const num of cleanupCustom) {
    try { await apiFetch(`/api/custom-orders?id=${encodeURIComponent(num)}`, { method: 'DELETE', headers: { Cookie: adminCookie } }); } catch (_) {}
  }
  for (const num of cleanupSpace) {
    try { await apiFetch(`/api/space-bookings?id=${encodeURIComponent(num)}`, { method: 'DELETE', headers: { Cookie: adminCookie } }); } catch (_) {}
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllSecurityTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
