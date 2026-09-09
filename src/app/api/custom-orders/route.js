import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCustomOrders, addCustomOrder, updateCustomOrderStatus, deleteCustomOrder } from '@/lib/custom-orders-store';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { validateCustomOrderPayload, sanitizeString } from '@/lib/validation';

export async function GET(request) {
  try {
    // 1. Enforce Admin Authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get custom orders error:', error);
        return NextResponse.json({ error: 'Помилка отримання замовлень з бази даних' }, { status: 500 });
      }
      return NextResponse.json(data || []);
    }

    const orders = getCustomOrders();
    return NextResponse.json(orders);
  } catch (err) {
    console.error('Get custom orders error:', err);
    return NextResponse.json({ error: 'Помилка отримання замовлень' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate limiting: 10 requests per 10 minutes per IP
    const rateLimitResponse = applyRateLimit(request, 'custom-order', 10, 10 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { isValid, errors, sanitized } = validateCustomOrderPayload(body);

    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const orderNumber = `CST-${crypto.randomInt(100000, 999999)}`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newOrder = {
      id: `cst-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      order_number: orderNumber,
      customer_name: sanitized.customer_name,
      customer_phone: sanitized.customer_phone,
      customer_email: sanitized.customer_email || '',
      category: sanitized.category,
      budget: sanitized.budget || 'Не вказано',
      deadline: sanitized.deadline || 'Не вказано',
      description: sanitized.description || '',
      status: 'pending_call',
      created_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { error: dbError } = await supabase.from('custom_orders').insert([
          {
            order_number: orderNumber,
            customer_name: newOrder.customer_name,
            customer_phone: newOrder.customer_phone,
            customer_email: newOrder.customer_email,
            category: newOrder.category,
            budget: newOrder.budget,
            deadline: newOrder.deadline,
            description: newOrder.description,
            status: 'new',
          },
        ]);

        if (dbError) {
          console.error('Supabase custom order insert error:', dbError);
          return NextResponse.json(
            { error: 'Помилка збереження замовлення в базі даних. Спробуйте пізніше.' },
            { status: 503 }
          );
        }
      } catch (dbErr) {
        console.error('Supabase custom order exception:', dbErr);
        return NextResponse.json(
          { error: 'Помилка з’єднання з базою даних. Спробуйте пізніше.' },
          { status: 503 }
        );
      }
    } else {
      addCustomOrder(newOrder);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      order: newOrder,
      message: 'Заявку на індивідуальне замовлення успішно надіслано!',
    });
  } catch (err) {
    console.error('Custom order error:', err);
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

    const validStatuses = ['pending_call', 'in_progress', 'completed', 'cancelled'];
    if (!id || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Недійсні параметри оновлення статусу' }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('custom_orders')
        .update({ status })
        .or(`id.eq.${id},order_number.eq.${id}`);

      if (error) {
        console.error('Supabase custom order update error:', error);
        return NextResponse.json({ error: 'Помилка оновлення статусу в базі даних' }, { status: 503 });
      }

      return NextResponse.json({ success: true, id, status });
    }

    const updated = updateCustomOrderStatus(id, status);
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error('Custom order patch error:', err);
    return NextResponse.json({ error: 'Помилка оновлення' }, { status: 500 });
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
        .from('custom_orders')
        .delete()
        .or(`id.eq.${id},order_number.eq.${id}`);

      if (error) {
        console.error('Supabase custom order delete error:', error);
        return NextResponse.json({ error: 'Помилка видалення замовлення з бази даних' }, { status: 503 });
      }

      return NextResponse.json({ success: true });
    }

    const ok = deleteCustomOrder(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Custom order delete error:', err);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
