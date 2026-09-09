import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getOrders, addOrder, updateOrderStatus, deleteOrder } from '@/lib/orders-store';

export async function GET() {
  const orders = getOrders();
  return NextResponse.json(orders);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      delivery_city,
      delivery_method,
      payment_method,
      notes,
      items,
      total,
    } = body;

    if (!customer_name?.trim() || !customer_phone?.trim() || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Будь ласка, заповніть обов'язкові поля (ім'я, телефон) та додайте товари" },
        { status: 400 }
      );
    }

    const orderNumber = `CS-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email?.trim() || '',
      delivery_city: delivery_city?.trim() || '',
      delivery_address: delivery_address?.trim() || '',
      delivery_method: delivery_method || 'nova_poshta',
      payment_method: payment_method || 'card',
      notes: notes?.trim() || '',
      items: Array.isArray(items) ? items : [],
      total_amount: parseFloat(total) || 0,
      status: 'pending',
      created_at: formattedDate,
    };

    // 1. Save to local & serverless store
    addOrder(newOrder);

    // 2. Try saving to Supabase if configured
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
              delivery_address: `${delivery_city || ''}, ${delivery_address || ''}`.trim(),
              delivery_method: newOrder.delivery_method,
              payment_method: newOrder.payment_method,
              total_amount: newOrder.total_amount,
              notes: newOrder.notes,
              status: 'pending',
            },
          ])
          .select()
          .single();

        if (dbOrder && !orderError) {
          const orderItems = newOrder.items.map((item) => ({
            order_id: dbOrder.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: (item.price || 0) * (item.quantity || 1),
          }));

          await supabase.from('order_items').insert(orderItems);
        }
      } catch (dbErr) {
        console.warn('Database save skipped or failed:', dbErr.message);
      }
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
      { error: 'Помилка обробки замовлення' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID та новий статус обов’язкові' }, { status: 400 });
    }

    const updated = updateOrderStatus(id, status);
    return NextResponse.json({ success: true, orders: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Помилка оновлення статусу' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID обов’язковий' }, { status: 400 });
    }

    const ok = deleteOrder(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
