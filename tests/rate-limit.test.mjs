import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { apiFetch, BASE_URL } from './helpers/test-client.mjs';

describe('Rate Limiting & IP Spoof Protection (rate-limit)', () => {
  const ATTACKER_IP = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
  const INNOCENT_IP = `198.51.100.${Math.floor(Math.random() * 200) + 201}`;

  test('1. Rate limiting enforces HTTP 429 on repeated requests', async () => {
    let got429 = false;
    for (let i = 0; i < 7; i++) {
      const res = await apiFetch('/api/admin/auth', {
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
    assert.ok(got429, 'Rate limiting enforces HTTP 429 Too Many Requests on repeated requests');
  });

  test('2. Different IP has independent rate limit', async () => {
    const innocentRes = await apiFetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': INNOCENT_IP,
      },
      body: JSON.stringify({ password: 'wrong_innocent' }),
    });
    assert.equal(
      innocentRes.status,
      401,
      `Different IP has independent rate limit (Innocent IP got ${innocentRes.status}, not 429)`
    );
  });

  test('3. Different namespaces do not conflict (admin-login vs orders)', async () => {
    const orderRes = await apiFetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ATTACKER_IP,
      },
      body: JSON.stringify({ items: [] }),
    });
    assert.equal(
      orderRes.status,
      400,
      `Different namespaces do not conflict (Blocked IP on admin-login gets 400 on orders, not 429: got ${orderRes.status})`
    );
  });

  test('4. IP cannot be spoofed via query parameter or request body', async () => {
    const spoofQueryRes = await apiFetch('/api/admin/auth?ip=1.2.3.4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ATTACKER_IP,
      },
      body: JSON.stringify({ password: 'wrong_spoof', ip: '1.2.3.4' }),
    });
    assert.equal(
      spoofQueryRes.status,
      429,
      'IP cannot be spoofed via query parameter (?ip=...) or request body ({ ip: ... })'
    );
  });

  test('5. Production rate limiter fails closed with HTTP 503', () => {
    const rateLimitPath = path.resolve(process.cwd(), 'src', 'lib', 'rate-limit.js');
    const rateLimitSrc = fs.readFileSync(rateLimitPath, 'utf8');

    const hasProdCheckRateLimit = rateLimitSrc.includes("if (process.env.NODE_ENV === 'production')") &&
      rateLimitSrc.includes('serviceUnavailable: true');
    const hasProd503Response = rateLimitSrc.includes('if (result.serviceUnavailable)') &&
      rateLimitSrc.includes('status: 503');

    assert.ok(hasProdCheckRateLimit, 'Production rateLimit fails closed (serviceUnavailable: true, never falls back to memory)');
    assert.ok(hasProd503Response, 'Production applyRateLimit returns HTTP 503 when external rate limiter is unavailable');
  });

  test('6. Netlify edge IP is prioritized over spoofed X-Forwarded-For', async () => {
    const SPOOF_TEST_NETLIFY_IP = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    let gotRateLimited = false;

    for (let i = 0; i < 7; i++) {
      const spoofedXff = `203.0.113.${10 + i}`;
      const res = await apiFetch('/api/admin/auth', {
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
    assert.ok(gotRateLimited, 'Rate limiter enforces HTTP 429 when client rotates spoofed X-Forwarded-For (Netlify IP prioritized)');

    const rateLimitPath = path.resolve(process.cwd(), 'src', 'lib', 'rate-limit.js');
    const rateLimitSrc = fs.readFileSync(rateLimitPath, 'utf8');
    const hasNetlifyPriority = rateLimitSrc.includes("request.headers.get('x-nf-client-connection-ip')");
    const hasUntrustedProdFallback = rateLimitSrc.includes("process.env.NODE_ENV === 'production'") &&
      rateLimitSrc.includes("'untrusted_client_ip'");

    assert.ok(hasNetlifyPriority, 'getClientIp prioritizes Netlify Edge x-nf-client-connection-ip over X-Forwarded-For');
    assert.ok(hasUntrustedProdFallback, 'getClientIp in production avoids trusting user-supplied X-Forwarded-For without edge proxy');
  });

  test('7. Canonical key builder and route wiring audit', () => {
    const rateLimitPath = path.resolve(process.cwd(), 'src', 'lib', 'rate-limit.js');
    const rateLimitSrc = fs.readFileSync(rateLimitPath, 'utf8');
    const hasKeyBuilder = rateLimitSrc.includes('export function buildRateLimitKey');
    const hasPerIpUsage = rateLimitSrc.includes('buildRateLimitKey(action, ip)');

    assert.ok(hasKeyBuilder && hasPerIpUsage, 'Rate limiter uses buildRateLimitKey to construct canonical ${namespace}:${ip}');

    const authSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/admin/auth/route.js'), 'utf8');
    const ordersSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/orders/route.js'), 'utf8');
    const customSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/custom-orders/route.js'), 'utf8');
    const spaceSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/space-bookings/route.js'), 'utf8');
    const wsSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/workshops/book/route.js'), 'utf8');

    assert.ok(authSrc.includes('`admin-login:${ip}`'), 'Admin login route explicitly passes admin-login:${ip}');
    assert.ok(ordersSrc.includes('`orders:${ip}`'), 'Orders route explicitly passes orders:${ip}');
    assert.ok(customSrc.includes('`custom-orders:${ip}`'), 'Custom orders route explicitly passes custom-orders:${ip}');
    assert.ok(spaceSrc.includes('`space-bookings:${ip}`'), 'Space bookings route explicitly passes space-bookings:${ip}');
    assert.ok(wsSrc.includes('`workshops:${ip}`'), 'Workshops route explicitly passes workshops:${ip}');
  });
});
