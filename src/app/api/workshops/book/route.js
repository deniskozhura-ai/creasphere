import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { addDemoBooking, updateDemoBookingStatus } from '@/lib/bookings-store';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      workshop_title,
      participants_count,
      participant_age,
      preferred_date,
      preferred_time,
      notes,
    } = body;

    if (!customer_name?.trim() || !customer_phone?.trim() || !workshop_title?.trim()) {
      return NextResponse.json(
        { error: "Будь ласка, заповніть обов'язкові поля: ім'я, телефон та майстер-клас." },
        { status: 400 }
      );
    }

    const bookingNumber = `MK-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newBooking = {
      id: `wb-${Date.now()}`,
      booking_number: bookingNumber,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email?.trim() || null,
      workshop_title: workshop_title.trim(),
      participants_count: parseInt(participants_count) || 1,
      participant_age: participant_age?.trim() || 'Не вказано',
      preferred_date: preferred_date || 'За домовленістю',
      preferred_time: preferred_time || 'За домовленістю',
      notes: notes?.trim() || '',
      status: 'new',
      created_at: now,
    };

    // Store in demo memory store
    addDemoBooking(newBooking);

    // Try saving to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('workshop_bookings').insert([
          {
            booking_number: bookingNumber,
            customer_name: newBooking.customer_name,
            customer_phone: newBooking.customer_phone,
            customer_email: newBooking.customer_email,
            workshop_title: newBooking.workshop_title,
            participants_count: newBooking.participants_count,
            preferred_date: newBooking.preferred_date,
            preferred_time: newBooking.preferred_time,
            notes: newBooking.notes,
            status: 'new',
          },
        ]);
      } catch (dbErr) {
        console.warn('Supabase booking insert skipped/failed:', dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      bookingNumber,
      message: 'Запис на майстер-клас успішно оформлено!',
    });
  } catch (err) {
    console.error('Workshop booking error:', err);
    return NextResponse.json(
      { error: 'Помилка при створенні запису. Спробуйте пізніше.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID та новий статус обов’язкові' }, { status: 400 });
    }

    updateDemoBookingStatus(id, status);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('workshop_bookings')
          .update({ status })
          .or(`id.eq.${id},booking_number.eq.${id}`);
      } catch (e) {
        console.warn('Supabase status update error:', e.message);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    return NextResponse.json({ error: 'Помилка оновлення статусу' }, { status: 500 });
  }
}
