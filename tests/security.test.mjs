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
  // 6 & 7. CLIENT PRICE & TOTAL MANIPULATION -> REJECTED/IGNORED
  // -----------------------------------------------------------------
  console.log('\n--- Test 6 & 7: Price & Total Manipulation Rejected/Ignored ---');
  let placedOrderNumber = null;
  try {
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
        payment_method: 'card',
        // ATTEMPT TO MANIPULATE PRICE AND TOTAL:
        total: 1.0,
        items: [{ id: 'p1', price: 0.01, quantity: 2 }],
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Order created successfully with server-authoritative pricing');
    assert(data.orderNumber && typeof data.orderNumber === 'string', `Valid orderNumber returned: ${data.orderNumber}`);
    placedOrderNumber = data.orderNumber;

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
  } catch (e) {
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
  } catch (e) {
    assert(false, `Test 15 failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 16. MASS ASSIGNMENT -> DENIED
  // -----------------------------------------------------------------
  console.log('\n--- Test 16: Mass Assignment Denied ---');
  try {
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
        items: [{ id: 'p1', quantity: 1 }],
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Order created with whitelisted schema');

    // Verify injected fields were not assigned as completed
    const adminOrdersRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    const adminOrders = await adminOrdersRes.json();
    const order = adminOrders.find((o) => o.order_number === data.orderNumber);
    assert(order && order.status === 'pending', 'Status was NOT mass-assigned to completed (stays pending)');
    assert(order && order.is_admin === undefined, 'is_admin field was stripped and discarded');
  } catch (e) {
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
  try {
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
        notes: 'Secret note',
        items: [{ id: 'p1', quantity: 1 }],
      }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 200, 'Order created');
    assert(
      !orderData.customer_name && !orderData.customer_phone && !orderData.customer_email && !orderData.delivery_address,
      'POST /api/orders response does NOT leak customer PII (only orderNumber returned)'
    );

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
