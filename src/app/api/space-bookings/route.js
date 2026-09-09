import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getSpaceBookings, addSpaceBooking, updateSpaceBookingStatus, deleteSpaceBooking } from '@/lib/space-bookings-store';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { validateSpacePayload, sanitizeString } from '@/lib/validation';

export async function GET(request) {
  try {
    // 1. Enforce Admin Authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('space_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get space bookings error:', error);
        return NextResponse.json({ error: 'Помилка отримання заявок з бази даних' }, { status: 500 });
      }
      return NextResponse.json(data || []);
    }

    const bookings = getSpaceBookings();
    return NextResponse.json(bookings);
  } catch (err) {
    console.error('Get space bookings error:', err);
    return NextResponse.json({ error: 'Помилка отримання заявок' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate limiting: 10 bookings per 10 minutes per IP
    const rateLimitResponse = applyRateLimit(request, 'space-booking', 10, 10 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { isValid, errors, sanitized } = validateSpacePayload(body);

    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const bookingNumber = `SP-${crypto.randomInt(100000, 999999)}`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newBooking = {
      id: `sp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      booking_number: bookingNumber,
      customer_name: sanitized.customer_name,
      customer_phone: sanitized.customer_phone,
      customer_email: sanitized.customer_email || '',
      tariff: sanitized.tariff,
      event_type: sanitized.tariff,
      event_date: sanitized.event_date,
      event_time: sanitized.event_time,
      duration_hours: sanitized.duration_hours,
      guests_count: sanitized.guests_count,
      notes: sanitized.notes || '',
      status: 'new',
      created_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { error: dbError } = await supabase.from('space_bookings').insert([
          {
            booking_number: bookingNumber,
            customer_name: newBooking.customer_name,
            customer_phone: newBooking.customer_phone,
            customer_email: newBooking.customer_email,
            tariff: newBooking.tariff,
            date: newBooking.event_date,
            time: newBooking.event_time,
            people_count: newBooking.guests_count,
            notes: newBooking.notes,
            status: 'new',
          },
        ]);

        if (dbError) {
          console.error('Supabase space booking insert error:', dbError);
          return NextResponse.json(
            { error: 'Помилка збереження заявки в базі даних. Спробуйте пізніше.' },
            { status: 503 }
          );
        }
      } catch (dbErr) {
        console.error('Supabase space booking exception:', dbErr);
        return NextResponse.json(
          { error: 'Помилка з’єднання з базою даних. Спробуйте пізніше.' },
          { status: 503 }
        );
      }
    } else {
      addSpaceBooking(newBooking);
    }

    return NextResponse.json({
      success: true,
      bookingNumber,
      booking: newBooking,
      message: 'Заявку на оренду успішно надіслано!',
    });
  } catch (err) {
    console.error('Space booking error:', err);
    return NextResponse.json(
      { error: 'Помилка при створенні заявки. Спробуйте пізніше.' },
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

    const validStatuses = ['new', 'confirmed', 'completed', 'cancelled'];
    if (!id || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Недійсні параметри оновлення статусу' }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('space_bookings')
        .update({ status })
        .or(`id.eq.${id},booking_number.eq.${id}`);

      if (error) {
        console.error('Supabase space booking update error:', error);
        return NextResponse.json({ error: 'Помилка оновлення статусу в базі даних' }, { status: 503 });
      }

      return NextResponse.json({ success: true, id, status });
    }

    const updated = updateSpaceBookingStatus(id, status);
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error('Space booking patch error:', err);
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
      return NextResponse.json({ error: 'ID заявки обов’язковий' }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('space_bookings')
        .delete()
        .or(`id.eq.${id},booking_number.eq.${id}`);

      if (error) {
        console.error('Supabase space booking delete error:', error);
        return NextResponse.json({ error: 'Помилка видалення заявки з бази даних' }, { status: 503 });
      }

      return NextResponse.json({ success: true });
    }

    const ok = deleteSpaceBooking(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Space booking delete error:', err);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
