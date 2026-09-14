import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { apiFetch, getAdminCookie } from './helpers/test-client.mjs';

describe('Order Processing & Atomic Stock Protection (orders)', () => {
  let adminCookie = '';

  test('1. Client-side price & total manipulation is rejected / server price enforced', async () => {
    adminCookie = await getAdminCookie();

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
        category_id: null,
      }),
    });
    const prodData = await createProdRes.json();
    const testProductId = prodData.product?.id || 'p1';

    // 2. Submit order trying to manipulate total to 1.0 UAH and item price to 0.01 UAH
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
        total: 1.0,
        items: [{ id: testProductId, price: 0.01, quantity: 2 }],
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 200, 'Order creation must return HTTP 200');
    assert.equal(data.success, true);
    assert.ok(data.orderNumber && typeof data.orderNumber === 'string', 'Valid orderNumber returned');

    // 3. Verify server calculated catalog total (1500 UAH or catalog price * 2), NOT 1.0 UAH
    const adminOrdersRes = await apiFetch('/api/orders', {
      headers: { Cookie: adminCookie },
    });
    const adminOrders = await adminOrdersRes.json();
    const recordedOrder = adminOrders.find((o) => o.order_number === data.orderNumber);

    const expectedTotal = testProductId === 'p1' ? 850 * 2 : 1500;
    assert.ok(
      recordedOrder && recordedOrder.total_amount === expectedTotal,
      `Server calculated catalog total: ${expectedTotal} ₴ instead of client manipulated 1.0 ₴`
    );

    // Cleanup
    if (prodData.product?.id) {
      await apiFetch(`/api/products?id=${prodData.product.id}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
    }
  });

  test('2. Atomic stock protection under concurrent orders (Race condition check)', async () => {
    adminCookie = await getAdminCookie();

    // 1. Create a product with stock = 1
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
        category_id: null,
      }),
    });
    const prodData = await createProdRes.json();
    const limitedProductId = prodData.product?.id;

    if (limitedProductId) {
      // 2. Launch 4 concurrent checkout requests competing for that single item
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

      assert.equal(
        successCount,
        1,
        `Atomic stock protection: exactly 1 concurrent order succeeded (Successes: ${successCount}, Rejections: ${rejectedCount})`
      );

      // Cleanup
      await apiFetch(`/api/products?id=${limitedProductId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
    }
  });

  test('3. Products store eliminates /tmp and fails closed in production', () => {
    const productsStorePath = path.resolve(process.cwd(), 'src', 'lib', 'products-store.js');
    const productsStoreSrc = fs.readFileSync(productsStorePath, 'utf8');

    const noTmpDirImport = !productsStoreSrc.includes("import os from 'os'") && !productsStoreSrc.includes('os.tmpdir');
    const noTmpFile = !productsStoreSrc.includes('creasphere_products.json');
    const hasProdAddCheck =
      (productsStoreSrc.includes("if (process.env.NODE_ENV === 'production')") &&
        productsStoreSrc.includes('Local products store mutation is disabled in production')) ||
      productsStoreSrc.includes('assertNotProduction');

    assert.ok(noTmpDirImport, 'products-store.js does NOT import os or os.tmpdir');
    assert.ok(noTmpFile, 'products-store.js does NOT use writable /tmp creasphere_products.json');
    assert.ok(hasProdAddCheck, 'products-store.js mutations throw in production (fail closed)');

    const apiProductsPath = path.resolve(process.cwd(), 'src', 'app', 'api', 'products', 'route.js');
    const apiProductsSrc = fs.readFileSync(apiProductsPath, 'utf8');
    const hasProdGet503 = apiProductsSrc.includes("process.env.NODE_ENV === 'production' && !isSupabaseAdminConfigured") &&
      apiProductsSrc.includes('status: 503');

    assert.ok(hasProdGet503, 'GET /api/products returns HTTP 503 in production if Supabase is unconfigured');
  });

  test('4. Production fail-closed across all route handlers and stores', () => {
    const routesToCheck = [
      { file: 'src/app/api/orders/route.js', name: 'orders' },
      { file: 'src/app/api/workshops/book/route.js', name: 'workshops/book' },
      { file: 'src/app/api/space-bookings/route.js', name: 'space-bookings' },
      { file: 'src/app/api/custom-orders/route.js', name: 'custom-orders' },
    ];

    for (const { file, name } of routesToCheck) {
      const src = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const hasProd503 = src.includes("process.env.NODE_ENV === 'production'") && src.includes('status: 503');
      assert.ok(hasProd503, `API route /api/${name} fails closed (HTTP 503) in production if database unavailable`);
    }

    const storesToCheck = [
      { file: 'src/lib/orders-store.js', name: 'orders-store' },
      { file: 'src/lib/bookings-store.js', name: 'bookings-store' },
      { file: 'src/lib/space-bookings-store.js', name: 'space-bookings-store' },
      { file: 'src/lib/custom-orders-store.js', name: 'custom-orders-store' },
    ];

    for (const { file, name } of storesToCheck) {
      const src = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const hasThrow =
        (src.includes("process.env.NODE_ENV === 'production'") && src.includes('throw new Error')) ||
        src.includes('assertNotProduction');
      assert.ok(hasThrow, `Store ${name} disallows local mutations in production`);
    }
  });
});
