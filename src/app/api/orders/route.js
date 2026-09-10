import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { getOrders, addOrder, updateOrderStatus, deleteOrder } from '@/lib/orders-store';
import { getProducts, decrementStockAtomic } from '@/lib/products-store';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateOrderPayload, sanitizeString } from '@/lib/validation';

export async function GET(request) {
  try {
    // 1. Enforce Admin Authorization to protect customer PII
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // 2. Query Supabase via Server Role client if configured
    if (isSupabaseAdminConfigured) {
      const { data: dbOrders, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get orders error:', error.message);
        return NextResponse.json(
          { error: 'Помилка завантаження замовлень' },
          { status: 500 }
        );
      }
      return NextResponse.json(dbOrders || []);
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба замовлень тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    // Fallback to local store in unconfigured/offline dev
    const orders = getOrders();
    return NextResponse.json(orders);
  } catch (err) {
    console.error('Get orders error:', err.message);
    return NextResponse.json({ error: 'Помилка завантаження замовлень' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate limiting: 20 orders per 10 minutes per IP + endpoint
    const ip = getClientIp(request);
    const rateLimitResponse = await applyRateLimit(request, `create-order:${ip}`, 20, 10 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // 2. Validate input schema & types (strict allowlist, strips client-submitted price/total)
    const { isValid, errors, sanitized } = validateOrderPayload(body);
    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    // 3. Cryptographically secure Order Number (e.g. CS-2026-9F4K2M7Q)
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderNumber = `CS-${year}-${randomHex}`;

    // 4. Supabase Atomic Order Creation via stored procedure
    if (isSupabaseAdminConfigured) {
      try {
        // Resolve item IDs to database UUIDs (support UUID, slug, SKU, or legacy ID)
        const { data: dbProducts, error: prodFetchError } = await supabaseAdmin
          .from('products')
          .select('id, sku, slug');

        if (prodFetchError) {
          console.error('Supabase fetch products error:', prodFetchError.message);
          return NextResponse.json(
            { error: 'Помилка завантаження каталогу товарів.' },
            { status: 503 }
          );
        }

        const DEMO_ID_TO_SKU = {
          p1: 'CS-GIFT-01',
          p2: 'CS-CER-02',
          p3: 'CS-KIT-03',
          p4: 'CS-TOY-04',
          p5: 'CS-CND-05',
          p6: 'CS-KIT-06',
        };

        const resolvedItems = [];
        for (const item of sanitized.items) {
          const rawId = String(item.id || '').trim();
          const targetSku = DEMO_ID_TO_SKU[rawId] || rawId;

          let matched = (dbProducts || []).find(
            (p) => p.id === rawId || p.sku === targetSku || p.slug === rawId
          );

          if (!matched) {
            return NextResponse.json(
              { error: 'Один із обраних товарів не знайдено в каталозі.' },
              { status: 400 }
            );
          }

          resolvedItems.push({ id: matched.id, quantity: item.quantity });
        }

        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('create_order_atomic', {
          p_order_number: orderNumber,
          p_customer_name: sanitized.customer_name,
          p_customer_phone: sanitized.customer_phone,
          p_customer_email: sanitized.customer_email || '',
          p_delivery_address: `${sanitized.delivery_city || ''}, ${sanitized.delivery_address || ''}`.trim(),
          p_delivery_method: sanitized.delivery_method,
          p_payment_method: sanitized.payment_method,
          p_notes: sanitized.notes || '',
          p_items: resolvedItems,
        });

        if (rpcError) {
          console.error('Supabase create_order_atomic error:', rpcError.message);
          if (rpcError.message.includes('INSUFFICIENT_STOCK')) {
            return NextResponse.json(
              { error: 'Один або декілька товарів відсутні у потрібній кількості на складі.' },
              { status: 400 }
            );
          }
          if (rpcError.message.includes('PRODUCT_NOT_FOUND')) {
            return NextResponse.json(
              { error: 'Один із обраних товарів не знайдено в каталозі.' },
              { status: 400 }
            );
          }
          return NextResponse.json(
            { error: 'Помилка збереження замовлення в базі даних.' },
            { status: 503 }
          );
        }

        // Return minimal confirmation without leaking PII
        return NextResponse.json({
          success: true,
          orderNumber,
          message: 'Замовлення успішно створено!',
        });
      } catch (dbErr) {
        console.error('Database atomic order exception:', dbErr.message);
        return NextResponse.json(
          { error: 'Помилка обробки замовлення. Спробуйте пізніше.' },
          { status: 503 }
        );
      }
    }

    // Fail closed in production if persistent database is unavailable
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба збереження замовлень тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    // 5. Local Dev / Offline Fallback with Atomic Stock Verification
    const allProducts = getProducts();
    const verifiedItems = [];
    let calculatedTotal = 0;

    for (const item of sanitized.items) {
      const product = allProducts.find((p) => p.id === item.id || p.sku === item.id || p.slug === item.id);

      if (!product) {
        return NextResponse.json(
          { error: `Товар з кодом «${item.id}» не знайдено в каталозі.` },
          { status: 400 }
        );
      }

      if (product.status === 'out_of_stock' || (product.stock <= 0 && product.status !== 'pre_order')) {
        return NextResponse.json(
          { error: `Товар «${product.name}» наразі відсутній на складі.` },
          { status: 400 }
        );
      }

      if (product.status !== 'pre_order' && product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Недостатньо залишку товару «${product.name}». Доступно: ${product.stock} шт.` },
          { status: 400 }
        );
      }

      const serverPrice = parseFloat(product.price) || 0;
      if (serverPrice <= 0) {
        return NextResponse.json(
          { error: `Помилка ціни товару «${product.name}».` },
          { status: 400 }
        );
      }

      const itemTotal = Math.round(serverPrice * item.quantity * 100) / 100;
      calculatedTotal += itemTotal;

      verifiedItems.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku || '',
        price: serverPrice,
        quantity: item.quantity,
        total: itemTotal,
        image: product.images?.[0] || product.image || '/gift_collection.webp',
      });
    }

    calculatedTotal = Math.round(calculatedTotal * 100) / 100;

    // Atomically decrement stock in memory/persistent store
    try {
      decrementStockAtomic(sanitized.items);
    } catch (stockErr) {
      return NextResponse.json({ error: stockErr.message }, { status: 400 });
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder = {
      id: `ord-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      order_number: orderNumber,
      customer_name: sanitized.customer_name,
      customer_phone: sanitized.customer_phone,
      customer_email: sanitized.customer_email || '',
      delivery_city: sanitized.delivery_city || '',
      delivery_address: sanitized.delivery_address || '',
      delivery_method: sanitized.delivery_method,
      payment_method: sanitized.payment_method,
      notes: sanitized.notes || '',
      items: verifiedItems,
      total_amount: calculatedTotal,
      status: 'pending',
      created_at: formattedDate,
    };

    addOrder(newOrder);

    // Return strictly minimal confirmation without customer PII
    return NextResponse.json({
      success: true,
      orderNumber,
      message: 'Замовлення успішно створено!',
    });
  } catch (err) {
    console.error('Order creation error:', err.message);
    return NextResponse.json(
      { error: 'Помилка обробки замовлення. Спробуйте пізніше.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // 1. Enforce Admin Authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const id = sanitizeString(body.id, 60);
    const status = sanitizeString(body.status, 50);

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!id || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Недійсні параметри зміни статусу' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('orders').update({ status });

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('order_number', id);
      }

      const { error } = await query;

      if (error) {
        console.error('Supabase order status update error:', error.message);
        return NextResponse.json({ error: 'Помилка оновлення статусу в базі даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true, id, status });
    }

    const updated = updateOrderStatus(id, status);
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error('Order patch error:', err.message);
    return NextResponse.json({ error: 'Помилка оновлення замовлення' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // 1. Enforce Admin Authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = sanitizeString(searchParams.get('id'), 60);

    if (!id) {
      return NextResponse.json({ error: 'ID замовлення обов’язковий' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('orders').delete();

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('order_number', id);
      }

      const { error } = await query;

      if (error) {
        console.error('Supabase order delete error:', error.message);
        return NextResponse.json({ error: 'Помилка видалення замовлення з бази даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true });
    }

    const ok = deleteOrder(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Order delete error:', err.message);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
