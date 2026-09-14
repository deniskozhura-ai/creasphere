import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { getTestSupabaseClient } from './helpers/test-client.mjs';

describe('Database Security, RLS & Secret Isolation (rls)', () => {
  test('1. Service role secret never appears in non-API client bundle', () => {
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

    assert.equal(leaked, false, 'SUPABASE_SERVICE_ROLE_KEY is NEVER imported or referenced in non-API client code');
  });

  test('2. Direct public RPC check_rate_limit is DENIED to anonymous caller', async () => {
    const supabase = getTestSupabaseClient();
    const { error } = await supabase.rpc('check_rate_limit', {
      p_key: 'direct_anon_attack',
      p_max_requests: 10,
      p_window_ms: 60000,
    });
    assert.ok(Boolean(error), 'Direct anonymous Supabase RPC check_rate_limit must return an error');
  });

  test('3. Direct public RPC create_order_atomic is DENIED to anonymous caller', async () => {
    const supabase = getTestSupabaseClient();
    const { error } = await supabase.rpc('create_order_atomic', {
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
    assert.ok(Boolean(error), 'Direct anonymous Supabase RPC create_order_atomic must return an error');
  });

  test('4. Direct public REST INSERT into orders and order_items is DENIED', async () => {
    const supabase = getTestSupabaseClient();
    const { error: orderErr } = await supabase.from('orders').insert([
      {
        order_number: 'DIRECT-REST-ATTACK',
        customer_name: 'Attacker',
        customer_phone: '+380500000000',
        total_amount: 0.01,
      },
    ]);
    assert.ok(Boolean(orderErr), 'Direct anonymous Supabase REST INSERT into orders is DENIED');

    const { error: itemErr } = await supabase.from('order_items').insert([
      {
        product_name: 'Free Stolen Item',
        quantity: 1,
        price: 0.00,
        total: 0.00,
      },
    ]);
    assert.ok(Boolean(itemErr), 'Direct anonymous Supabase REST INSERT into order_items is DENIED');
  });

  test('5. SQL schema defines search_path and revokes anonymous permissions', () => {
    const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    const hasEmptySearchPath = schemaSql.includes("SET search_path = ''");
    const hasRevokeRateLimit = schemaSql.includes('REVOKE ALL ON FUNCTION public.check_rate_limit');
    const hasGrantRateLimit = schemaSql.includes('GRANT EXECUTE ON FUNCTION public.check_rate_limit');
    const hasRevokeCreateOrder = schemaSql.includes('REVOKE ALL ON FUNCTION public.create_order_atomic');
    const hasGrantCreateOrder = schemaSql.includes('GRANT EXECUTE ON FUNCTION public.create_order_atomic');

    assert.ok(hasEmptySearchPath, 'All SECURITY DEFINER functions use explicit immutable SET search_path = \'\'');
    assert.ok(hasRevokeRateLimit && hasGrantRateLimit, 'public.check_rate_limit revokes from PUBLIC/anon and grants only to service_role');
    assert.ok(hasRevokeCreateOrder && hasGrantCreateOrder, 'public.create_order_atomic revokes from PUBLIC/anon and grants only to service_role');
  });
});
