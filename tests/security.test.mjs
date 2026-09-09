/**
 * Comprehensive Automated Security & Access Control Test Suite for CreaSphere
 * Tests:
 * 1. Admin Authentication (correct/wrong password, session tokens, logout, invalid cookie)
 * 2. Rate Limiting (verifying HTTP 429 on brute force attacks)
 * 3. Products API Authorization & Validation (401 on unauthenticated POST/PUT/DELETE, negative price rejection)
 * 4. Orders Security & Price Integrity (401 on GET/PATCH/DELETE, server-authoritative price calculation, negative/zero/string quantity rejection)
 * 5. Workshop, Space & Custom Orders Privacy & Validation (401 on private GET, XSS script stripping, phone validation)
 * 6. Session Revocation (Logout token invalidation)
 */

import fs from 'fs';
import path from 'path';

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

// Dynamic client IP for this test run to ensure isolation across repeated test runs
const TEST_IP = `10.200.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;

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

// Wrapper to include test client IP in request headers
async function apiFetch(path, options = {}) {
  const headers = {
    'x-forwarded-for': TEST_IP,
    ...(options.headers || {}),
  };
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

async function runTests() {
  console.log('====================================================');
  console.log(`🔒 RUNNING CREASPHERE SECURITY AUDIT TEST SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Test IP: ${TEST_IP}`);
  console.log('====================================================\n');

  let adminCookie = '';

  // -----------------------------------------------------------------
  // 1. ADMIN AUTHENTICATION TESTS
  // -----------------------------------------------------------------
  console.log('--- 1. Admin Authentication Tests ---');

  // 1.1 Wrong password returns 401
  try {
    const res = await apiFetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong_password_12345' }),
    });
    assert(res.status === 401, 'Wrong admin password returns HTTP 401');
  } catch (e) {
    assert(false, `Wrong password test failed with error: ${e.message}`);
  }

  // 1.2 Correct password login
  try {
    const res = await apiFetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword }),
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    assert(res.status === 200 && data.success, 'Correct admin password logs in with HTTP 200');
    assert(setCookie && setCookie.includes('creasphere_admin_auth='), 'Server sets HttpOnly creasphere_admin_auth cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
  } catch (e) {
    assert(false, `Correct password login failed: ${e.message}`);
  }

  // 1.3 Verify session with cookie
  try {
    const res = await apiFetch('/api/admin/auth', {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    assert(res.status === 200 && data.authenticated === true, 'Valid session cookie returns authenticated: true');
  } catch (e) {
    assert(false, `Session verification failed: ${e.message}`);
  }

  // 1.4 Fake or unverified session token rejected
  try {
    const res = await apiFetch('/api/admin/auth', {
      headers: { Cookie: 'creasphere_admin_auth=fake_invalid_session_token_123' },
    });
    const data = await res.json();
    assert(data.authenticated === false, 'Arbitrary unverified session token is REJECTED');
  } catch (e) {
    assert(false, `Old static token rejection failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 2. BRUTE FORCE RATE LIMITING TESTS
  // -----------------------------------------------------------------
  console.log('\n--- 2. Rate Limiting Tests ---');

  // 2.1 Rapid brute force login attempts from dedicated attacker IP
  const ATTACKER_IP = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
  try {
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${BASE_URL}/api/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ATTACKER_IP,
        },
        body: JSON.stringify({ password: `brute_force_${i}` }),
      });
      lastStatus = res.status;
    }
    assert(lastStatus === 429, `Brute force attacker receives HTTP 429 Too Many Requests (Got: ${lastStatus})`);
  } catch (e) {
    assert(false, `Rate limiting test failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 3. PRODUCTS API AUTHORIZATION & MASS ASSIGNMENT TESTS
  // -----------------------------------------------------------------
  console.log('\n--- 3. Products API Authorization Tests ---');

  // 3.1 Public GET works
  try {
    const res = await apiFetch('/api/products');
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data), 'Public GET /api/products returns HTTP 200 and array');
  } catch (e) {
    assert(false, `Public GET products failed: ${e.message}`);
  }

  // 3.2 Unauthenticated POST /api/products blocked
  try {
    const res = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Item', price: 10 }),
    });
    assert(res.status === 401, 'Unauthenticated POST /api/products returns HTTP 401 (Blocked)');
  } catch (e) {
    assert(false, `Unauthenticated POST products failed: ${e.message}`);
  }

  // 3.3 Unauthenticated PUT /api/products blocked
  try {
    const res = await apiFetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'p1', name: 'Hacked Price', price: 0.01 }),
    });
    assert(res.status === 401, 'Unauthenticated PUT /api/products returns HTTP 401 (Blocked)');
  } catch (e) {
    assert(false, `Unauthenticated PUT products failed: ${e.message}`);
  }

  // 3.4 Unauthenticated DELETE /api/products blocked
  try {
    const res = await apiFetch('/api/products?id=p1', {
      method: 'DELETE',
    });
    assert(res.status === 401, 'Unauthenticated DELETE /api/products returns HTTP 401 (Blocked)');
  } catch (e) {
    assert(false, `Unauthenticated DELETE products failed: ${e.message}`);
  }

  // 3.5 Authenticated Admin can manage products with validation
  let createdProductId = null;
  try {
    // Attempt with invalid negative price
    const invalidRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ name: 'Test Product', price: -50, stock: 5 }),
    });
    assert(invalidRes.status === 400, 'Authenticated POST with negative price returns HTTP 400 Validation Error');

    // Valid product creation
    const validRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Secured Workshop Item',
        price: 450,
        stock: 10,
        category_id: '1',
        description: 'Quality tested craft piece',
      }),
    });
    const validData = await validRes.json();
    assert(validRes.status === 200 && validData.success, 'Authenticated Admin POST /api/products succeeds');
    if (validData.product) {
      createdProductId = validData.product.id;
    }

    // Cleanup product
    if (createdProductId) {
      const delRes = await apiFetch(`/api/products?id=${createdProductId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      assert(delRes.status === 200, 'Authenticated Admin DELETE /api/products cleanup succeeds');
    }
  } catch (e) {
    assert(false, `Authenticated products test failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 4. ORDERS SECURITY & SERVER-AUTHORITATIVE PRICING TESTS
  // -----------------------------------------------------------------
  console.log('\n--- 4. Orders Security & Price Integrity Tests ---');

  // 4.1 Unauthenticated GET /api/orders blocked (PII Protection!)
  try {
    const res = await apiFetch('/api/orders');
    assert(res.status === 401, 'Public GET /api/orders returns HTTP 401 (Customer PII is NOT leaked)');
  } catch (e) {
    assert(false, `Public GET orders failed: ${e.message}`);
  }

  // 4.2 Unauthenticated PATCH /api/orders blocked
  try {
    const res = await apiFetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'ord-1', status: 'cancelled' }),
    });
    assert(res.status === 401, 'Unauthenticated PATCH /api/orders returns HTTP 401 (Blocked)');
  } catch (e) {
    assert(false, `Unauthenticated PATCH orders failed: ${e.message}`);
  }

  // 4.3 Unauthenticated DELETE /api/orders blocked
  try {
    const res = await apiFetch('/api/orders?id=ord-1', {
      method: 'DELETE',
    });
    assert(res.status === 401, 'Unauthenticated DELETE /api/orders returns HTTP 401 (Blocked)');
  } catch (e) {
    assert(false, `Unauthenticated DELETE orders failed: ${e.message}`);
  }

  // 4.4 Price Manipulation Attempt: Client tries to buy Product p1 (750 UAH) for 1 UAH
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Audit Tester',
        customer_phone: '+380501234567',
        customer_email: 'audit@example.com',
        delivery_city: 'Павлоград',
        delivery_address: 'Відділення №1',
        delivery_method: 'nova_poshta',
        payment_method: 'card',
        // ATTACK PAYLOAD: fake total and fake price
        total: 1.0,
        items: [
          {
            id: 'p1',
            price: 0.5,
            quantity: 2,
          },
        ],
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Public order creation succeeds with verified payload');
    assert(
      data.order && data.order.total_amount === 1500,
      `Server RECALCULATED real price: 1500 ₴ instead of client-supplied 1.0 ₴ (Actual total: ${data.order?.total_amount} ₴)`
    );
    assert(
      data.order && data.order.items[0].price === 750,
      `Server used catalog price: 750 ₴ instead of client-supplied 0.5 ₴ (Actual item price: ${data.order?.items[0]?.price} ₴)`
    );
  } catch (e) {
    assert(false, `Price manipulation prevention test failed: ${e.message}`);
  }

  // 4.5 Invalid non-existent product rejected
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Audit Tester',
        customer_phone: '+380501234567',
        items: [{ id: 'non_existent_product_xyz', quantity: 1 }],
      }),
    });
    assert(res.status === 400, `Ordering non-existent product returns HTTP 400 (Received: ${res.status})`);
  } catch (e) {
    assert(false, `Non-existent product test failed: ${e.message}`);
  }

  // 4.6 Negative quantity rejected
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Audit Tester',
        customer_phone: '+380501234567',
        items: [{ id: 'p1', quantity: -3 }],
      }),
    });
    assert(res.status === 400, `Ordering negative quantity returns HTTP 400 (Received: ${res.status})`);
  } catch (e) {
    assert(false, `Negative quantity test failed: ${e.message}`);
  }

  // 4.7 Zero quantity rejected
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Audit Tester',
        customer_phone: '+380501234567',
        items: [{ id: 'p1', quantity: 0 }],
      }),
    });
    assert(res.status === 400, `Ordering zero quantity returns HTTP 400 (Received: ${res.status})`);
  } catch (e) {
    assert(false, `Zero quantity test failed: ${e.message}`);
  }

  // 4.8 String quantity rejected
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Audit Tester',
        customer_phone: '+380501234567',
        items: [{ id: 'p1', quantity: '2' }],
      }),
    });
    assert(res.status === 400, `Ordering string quantity returns HTTP 400 (Received: ${res.status})`);
  } catch (e) {
    assert(false, `String quantity test failed: ${e.message}`);
  }

  // 4.9 Authenticated Admin can read orders list
  try {
    const res = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data), 'Authenticated Admin GET /api/orders succeeds with HTTP 200');
  } catch (e) {
    assert(false, `Authenticated GET orders failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 5. WORKSHOPS, SPACE & CUSTOM ORDERS TESTS
  // -----------------------------------------------------------------
  console.log('\n--- 5. Workshop, Space & Custom Orders Tests ---');

  // 5.1 Workshops bookings privacy: unauthenticated GET blocked
  try {
    const res = await apiFetch('/api/workshops/book');
    assert(res.status === 401, 'Public GET /api/workshops/book returns HTTP 401 (PII protected)');
  } catch (e) {
    assert(false, `Public GET workshops failed: ${e.message}`);
  }

  // 5.2 Workshops mutation without auth blocked
  try {
    const res = await apiFetch('/api/workshops/book', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'wb-1', status: 'completed' }),
    });
    assert(res.status === 401, 'Unauthenticated PATCH /api/workshops/book returns HTTP 401');
  } catch (e) {
    assert(false, `Unauthenticated PATCH workshops failed: ${e.message}`);
  }

  // 5.3 Space bookings privacy: unauthenticated GET blocked
  try {
    const res = await apiFetch('/api/space-bookings');
    assert(res.status === 401, 'Public GET /api/space-bookings returns HTTP 401 (PII protected)');
  } catch (e) {
    assert(false, `Public GET space bookings failed: ${e.message}`);
  }

  // 5.4 Custom orders privacy: unauthenticated GET blocked
  try {
    const res = await apiFetch('/api/custom-orders');
    assert(res.status === 401, 'Public GET /api/custom-orders returns HTTP 401 (PII protected)');
  } catch (e) {
    assert(false, `Public GET custom orders failed: ${e.message}`);
  }

  // 5.5 Public Workshop Booking creation works and sanitizes input (XSS protection)
  try {
    const res = await apiFetch('/api/workshops/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: '<script>alert("XSS")</script>Ольга Василенко',
        customer_phone: '+380997778899',
        workshop_title: 'Гончарство та кераміка',
        participants_count: 2,
        notes: '<img src=x onerror=alert(1)>Святковий запис',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Public booking creation succeeds');
    assert(
      data.booking && !data.booking.customer_name.includes('<script>'),
      'XSS script tag is stripped from customer_name'
    );
    assert(
      data.booking && !data.booking.notes.includes('<img'),
      'XSS img onerror tag is stripped from notes'
    );
  } catch (e) {
    assert(false, `Workshop booking XSS sanitization test failed: ${e.message}`);
  }

  // 5.6 Custom order creation with invalid phone rejected
  try {
    const res = await apiFetch('/api/custom-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Андрій',
        customer_phone: '123', // invalid short phone
      }),
    });
    assert(res.status === 400, 'Custom order with invalid phone returns HTTP 400');
  } catch (e) {
    assert(false, `Custom order validation test failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 6. SESSION REVOCATION / LOGOUT TEST
  // -----------------------------------------------------------------
  console.log('\n--- 6. Session Revocation (Logout) Test ---');

  try {
    const logoutRes = await apiFetch('/api/admin/auth', {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(logoutRes.status === 200, 'DELETE /api/admin/auth returns HTTP 200');

    // Attempt to use revoked session token
    const afterLogoutRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    assert(afterLogoutRes.status === 401, 'Using revoked session token returns HTTP 401 (Session invalidated)');
  } catch (e) {
    assert(false, `Logout test failed: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
