import { NextResponse } from 'next/server';
import { addCustomOrder, updateCustomOrderStatus } from '@/lib/custom-orders-store';

export async function POST(request) {
  try {
    const body = await request.json();
    const { customer_name, customer_phone } = body;

    if (!customer_name?.trim() || !customer_phone?.trim()) {
      return NextResponse.json(
        { error: "Будь ласка, вкажіть ваше ім'я та контактний номер телефону." },
        { status: 400 }
      );
    }

    const orderNumber = `CST-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newOrder = {
      id: `cst-${Date.now()}`,
      order_number: orderNumber,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      status: 'pending_call',
      created_at: now,
    };

    addCustomOrder(newOrder);

    return NextResponse.json({
      success: true,
      orderNumber,
      message: "Заявку прийнято! Ми зв'яжемося з вами найближчим часом.",
    });
  } catch (err) {
    console.error('Custom order API error:', err);
    return NextResponse.json(
      { error: 'Помилка при створенні заявки. Спробуйте пізніше.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID та статус обов’язкові' }, { status: 400 });
    }

    updateCustomOrderStatus(id, status);
    return NextResponse.json({ success: true, status });
  } catch (err) {
    return NextResponse.json({ error: 'Помилка оновлення статусу' }, { status: 500 });
  }
}
