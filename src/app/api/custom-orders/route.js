import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { getCustomOrders, addCustomOrder, updateCustomOrderStatus, deleteCustomOrder } from '@/lib/custom-orders-store';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateCustomOrderPayload, sanitizeString } from '@/lib/validation';

export async function GET(request) {
  try {
    // 1. Enforce Admin Authorization (Protect Customer PII!)
    const authError = await requireAdmin(request);
    if (authError) return authError;

    if (isSupabaseAdminConfigured) {
      const { data: dbOrders, error } = await supabaseAdmin
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get custom orders error:', error.message);
        return NextResponse.json(
          { error: 'Помилка завантаження індивідуальних замовлень' },
          { status: 500 }
        );
      }
      return NextResponse.json(dbOrders || []);
    }

    const orders = getCustomOrders();
    return NextResponse.json(orders);
  } catch (err) {
    console.error('Get custom orders error:', err.message);
    return NextResponse.json({ error: 'Помилка завантаження' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate Limiting: 10 custom orders per 10 minutes per IP + endpoint
    const ip = getClientIp(request);
    const rateLimitResponse = await applyRateLimit(request, `custom-order:${ip}`, 10, 10 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // 2. Strict Input Validation & XSS Sanitization
    const { isValid, errors, sanitized } = validateCustomOrderPayload(body);
    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderNumber = `CS-${year}-${randomHex}`;

    const now = new Date().toISOString();

    const newOrder = {
      id: `co-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      order_number: orderNumber,
      customer_name: sanitized.customer_name,
      customer_phone: sanitized.customer_phone,
      customer_email: sanitized.customer_email || '',
      category: sanitized.category || 'Ручна робота',
      budget: sanitized.budget || '',
      deadline: sanitized.deadline || '',
      description: sanitized.description || '',
      status: 'new',
      created_at: now,
    };

    if (isSupabaseAdminConfigured) {
      try {
        const { error: dbError } = await supabaseAdmin.from('custom_orders').insert([
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
          console.error('Supabase custom order insert error:', dbError.message);
          return NextResponse.json(
            { error: 'Помилка збереження замовлення в базі даних.' },
            { status: 503 }
          );
        }
      } catch (dbErr) {
        console.error('Supabase custom order exception:', dbErr.message);
        return NextResponse.json(
          { error: 'Помилка збереження замовлення. Спробуйте пізніше.' },
          { status: 503 }
        );
      }
    } else {
      addCustomOrder(newOrder);
    }

    // Return strictly minimal confirmation without customer PII
    return NextResponse.json({
      success: true,
      orderNumber,
      message: 'Заявку на індивідуальне замовлення успішно надіслано!',
    });
  } catch (err) {
    console.error('Custom order error:', err.message);
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

    const validStatuses = ['new', 'in_progress', 'completed', 'cancelled'];
    if (!id || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Недійсні параметри зміни статусу' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const { error } = await supabaseAdmin
        .from('custom_orders')
        .update({ status })
        .or(`id.eq.${id},order_number.eq.${id}`);

      if (error) {
        console.error('Supabase custom order update error:', error.message);
        return NextResponse.json({ error: 'Помилка оновлення статусу в базі даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true, id, status });
    }

    const updated = updateCustomOrderStatus(id, status);
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error('Custom order patch error:', err.message);
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
      const { error } = await supabaseAdmin
        .from('custom_orders')
        .delete()
        .or(`id.eq.${id},order_number.eq.${id}`);

      if (error) {
        console.error('Supabase custom order delete error:', error.message);
        return NextResponse.json({ error: 'Помилка видалення замовлення з бази даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true });
    }

    const ok = deleteCustomOrder(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Custom order delete error:', err.message);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
