import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getOrders, addOrder, updateOrderStatus, deleteOrder } from '@/lib/orders-store';
import { getProducts } from '@/lib/products-store';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { validateOrderPayload, sanitizeString } from '@/lib/validation';

export async function GET(request) {
  try {
    // 1. Enforce Admin Authorization to protect customer PII
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // 2. Query Supabase as source of truth if configured
    if (isSupabaseConfigured) {
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get orders error:', error);
        return NextResponse.json(
          { error: 'Помилка завантаження замовлень з бази даних' },
          { status: 500 }
        );
      }
      return NextResponse.json(dbOrders || []);
    }

    // Fallback to local store in unconfigured/offline dev
    const orders = getOrders();
    return NextResponse.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    return NextResponse.json({ error: 'Помилка завантаження замовлень' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate limiting: 20 orders per 10 minutes per IP
    const rateLimitResponse = applyRateLimit(request, 'create-order', 20, 10 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // 2. Validate input schema & types (whitelists fields, strips client price/total)
    const { isValid, errors, sanitized } = validateOrderPayload(body);
    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    // 3. SERVER-AUTHORITATIVE PRICE CALCULATION & STOCK VERIFICATION
    let allProducts = [];
    if (isSupabaseConfigured) {
      const { data: dbProducts, error: prodErr } = await supabase
        .from('products')
        .select('*');
      if (prodErr || !dbProducts) {
        console.error('Supabase fetch products error:', prodErr);
        return NextResponse.json(
          { error: 'Помилка доступу до каталогу товарів' },
          { status: 503 }
        );
      }
      allProducts = dbProducts;
    } else {
      allProducts = getProducts();
    }

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

    // 4. Secure cryptographically random Order Number
    const orderNumber = `CS-${crypto.randomInt(100000, 999999)}`;
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

    // 5. Save to Supabase as source of truth if configured
    if (isSupabaseConfigured) {
      try {
        const { data: dbOrder, error: orderError } = await supabase
          .from('orders')
          .insert([
            {
              order_number: orderNumber,
              customer_name: newOrder.customer_name,
              customer_phone: newOrder.customer_phone,
              customer_email: newOrder.customer_email,
              delivery_address: `${sanitized.delivery_city || ''}, ${sanitized.delivery_address || ''}`.trim(),
              delivery_method: newOrder.delivery_method,
              payment_method: newOrder.payment_method,
              total_amount: newOrder.total_amount,
              notes: newOrder.notes,
              status: 'pending',
            },
          ])
          .select()
          .single();

        if (orderError || !dbOrder) {
          console.error('Supabase order insert error:', orderError);
          return NextResponse.json(
            { error: 'Помилка збереження замовлення в базі даних. Спробуйте пізніше.' },
            { status: 503 }
          );
        }

        const orderItems = newOrder.items.map((item) => ({
          order_id: dbOrder.id,
          product_id: item.id.includes('-') && item.id.length > 20 ? item.id : null,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) {
          console.error('Supabase order items insert error:', itemsError);
          return NextResponse.json(
            { error: 'Помилка збереження позицій замовлення в базі даних.' },
            { status: 503 }
          );
        }
      } catch (dbErr) {
        console.error('Database save exception:', dbErr);
        return NextResponse.json(
          { error: 'Помилка з’єднання з базою даних. Спробуйте пізніше.' },
          { status: 503 }
        );
      }
    } else {
      // Local development fallback
      addOrder(newOrder);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      order: newOrder,
      message: 'Замовлення успішно створено!',
    });
  } catch (err) {
    console.error('Order creation error:', err);
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

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .or(`id.eq.${id},order_number.eq.${id}`);

      if (error) {
        console.error('Supabase order status update error:', error);
        return NextResponse.json({ error: 'Помилка оновлення статусу в базі даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true, id, status });
    }

    const updated = updateOrderStatus(id, status);
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error('Order patch error:', err);
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

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .or(`id.eq.${id},order_number.eq.${id}`);

      if (error) {
        console.error('Supabase order delete error:', error);
        return NextResponse.json({ error: 'Помилка видалення замовлення з бази даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true });
    }

    const ok = deleteOrder(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Order delete error:', err);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
