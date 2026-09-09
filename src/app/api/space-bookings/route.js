import { NextResponse } from 'next/server';
import { addSpaceBooking, updateSpaceBookingStatus } from '@/lib/space-bookings-store';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      event_type,
      event_date,
      event_time,
      duration_hours,
      guests_count,
      notes,
    } = body;

    if (!customer_name?.trim() || !customer_phone?.trim()) {
      return NextResponse.json(
        { error: "Будь ласка, вкажіть ваше ім'я та контактний телефон." },
        { status: 400 }
      );
    }

    const bookingNumber = `SP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newBooking = {
      id: `sp-${Date.now()}`,
      booking_number: bookingNumber,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      event_type: event_type || 'Оренда простору / подія',
      event_date: event_date || 'За домовленістю',
      event_time: event_time || 'За домовленістю',
      duration_hours: parseInt(duration_hours) || 2,
      guests_count: parseInt(guests_count) || 5,
      notes: notes?.trim() || '',
      status: 'new',
      created_at: now,
    };

    addSpaceBooking(newBooking);

    return NextResponse.json({
      success: true,
      bookingNumber,
      message: 'Заявку на оренду простору успішно надіслано!',
    });
  } catch (err) {
    console.error('Space booking API error:', err);
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

    updateSpaceBookingStatus(id, status);
    return NextResponse.json({ success: true, status });
  } catch (err) {
    return NextResponse.json({ error: 'Помилка оновлення статусу' }, { status: 500 });
  }
}
