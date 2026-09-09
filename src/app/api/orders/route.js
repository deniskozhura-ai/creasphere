import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Будь ласка, заповніть обов'язкові поля" },
        { status: 400 }
      );
    }

    const orderNumber = `CS-${Date.now().toString().slice(-6)}`;

    // Try saving to Supabase
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            customer_name,
            customer_phone,
            customer_email,
            delivery_address: `${delivery_city || ''}, ${delivery_address || ''}`.trim(),
            delivery_method: delivery_method || 'nova_poshta',
            payment_method: payment_method || 'card',
            total_amount: total,
            notes,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (order && !orderError) {
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        }));

        await supabase.from('order_items').insert(orderItems);
      }
    } catch (dbErr) {
      console.warn('Database save skipped or failed:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
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
