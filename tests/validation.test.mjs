import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, getAdminCookie } from './helpers/test-client.mjs';

describe('Input Validation & Integrity (validation)', () => {
  let adminCookie = '';

  test('1. Negative quantity returns HTTP 400', async () => {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        items: [{ id: 'p1', quantity: -3 }],
      }),
    });
    assert.equal(res.status, 400, `Negative quantity must return HTTP 400 (Got ${res.status})`);
  });

  test('2. Huge quantity returns HTTP 400', async () => {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        items: [{ id: 'p1', quantity: 99999999 }],
      }),
    });
    assert.equal(res.status, 400, `Huge quantity must return HTTP 400 (Got ${res.status})`);
  });

  test('3. Nonexistent product returns HTTP 400', async () => {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        items: [{ id: 'nonexistent_prod_9999', quantity: 1 }],
      }),
    });
    assert.equal(res.status, 400, `Nonexistent product must return HTTP 400 (Got ${res.status})`);
  });

  test('4. Insufficient stock returns HTTP 400', async () => {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Auditor',
        customer_phone: '+380501112233',
        items: [{ id: 'p4', quantity: 500 }],
      }),
    });
    assert.equal(res.status, 400, `Insufficient stock must return HTTP 400 (Got ${res.status})`);
  });

  test('5. Mass assignment is denied (status stays pending, internal fields stripped)', async () => {
    adminCookie = await getAdminCookie();

    const res = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Mass Assign Tester',
        customer_phone: '+380501112233',
        is_admin: true,
        role: 'superadmin',
        status: 'completed',
        payment_status: 'paid',
        payment_method: 'requisites',
        items: [{ id: 'p1', quantity: 1 }],
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 200, 'Order created with whitelisted schema');

    const adminOrdersRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    const adminOrders = await adminOrdersRes.json();
    const order = adminOrders.find((o) => o.order_number === data.orderNumber);

    assert.ok(order && order.status === 'pending', 'Status was NOT mass-assigned to completed (stays pending)');
    assert.ok(order && order.is_admin === undefined, 'is_admin field was stripped and discarded');
  });

  test('6. Product validation rejects missing stock, negative stock, and invalid category_id', async () => {
    adminCookie = await getAdminCookie();

    const noStockRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ name: 'No Stock Item', price: 100 }),
    });
    assert.equal(noStockRes.status, 400, 'Product creation with missing stock must return HTTP 400');

    const negStockRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ name: 'Neg Stock Item', price: 100, stock: -5 }),
    });
    assert.equal(negStockRes.status, 400, 'Product creation with negative stock must return HTTP 400');

    const badCatRes = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ name: 'Bad Cat Item', price: 100, stock: 10, category_id: 'invalid-non-uuid-123' }),
    });
    assert.equal(badCatRes.status, 400, 'Product creation with invalid non-UUID category_id must return HTTP 400');
  });

  test('7. Workshops public filtering excludes archived workshops', async () => {
    adminCookie = await getAdminCookie();

    const createWRes = await apiFetch('/api/workshops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        title: `Archived Test Workshop ${Date.now()}`,
        status: 'archived',
        max_participants: 5,
        available_spots: 5,
      }),
    });
    const createWData = await createWRes.json();
    const testWorkshopId = createWData.workshop?.id;

    if (testWorkshopId) {
      const publicWRes = await apiFetch('/api/workshops');
      const publicWorkshops = await publicWRes.json();
      const foundInPublic = (publicWorkshops || []).some((w) => w.id === testWorkshopId);
      assert.equal(foundInPublic, false, 'Public GET /api/workshops excludes archived workshops');

      const adminWRes = await apiFetch('/api/workshops', {
        headers: { Cookie: adminCookie },
      });
      const adminWorkshops = await adminWRes.json();
      const foundInAdmin = (adminWorkshops || []).some((w) => w.id === testWorkshopId);
      assert.equal(foundInAdmin, true, 'Admin GET /api/workshops includes all workshops');

      await apiFetch(`/api/workshops?id=${testWorkshopId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
    }
  });

  test('8. Workshop booking capacity hardening rejects overflow', async () => {
    adminCookie = await getAdminCookie();

    const capWRes = await apiFetch('/api/workshops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        title: `Limited Workshop ${Date.now()}`,
        status: 'active',
        max_participants: 5,
        available_spots: 2,
      }),
    });
    const capWData = await capWRes.json();
    const capWorkshopId = capWData.workshop?.id;
    const capTitle = capWData.workshop?.title;

    if (capTitle) {
      const overflowRes = await apiFetch('/api/workshops/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Overflow Tester',
          customer_phone: '+380501112233',
          workshop_title: capTitle,
          participants_count: 5,
        }),
      });
      assert.equal(overflowRes.status, 400, 'Workshop booking exceeding available spots is rejected with HTTP 400');

      const validBookRes = await apiFetch('/api/workshops/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Valid Tester',
          customer_phone: '+380501112233',
          workshop_title: capTitle,
          participants_count: 2,
        }),
      });
      const validBookData = await validBookRes.json();
      assert.equal(validBookRes.status, 200, 'Workshop booking within available spots succeeds');
      assert.equal(validBookData.success, true);

      await apiFetch(`/api/workshops?id=${capWorkshopId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
    }
  });
});
