import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getDemoBookings, addDemoBooking, updateDemoBookingStatus, deleteDemoBooking } from '@/lib/bookings-store';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { validateWorkshopPayload, sanitizeString } from '@/lib/validation';

export async function GET(request) {
  try {
    // 1. Enforce Admin Authorization to protect customer PII
    const authError = await requireAdmin(request);
    if (authError) return authError;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('workshop_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get workshop bookings error:', error);
        return NextResponse.json({ error: 'Помилка отримання записів з бази даних' }, { status: 500 });
      }
      return NextResponse.json(data || []);
    }

    const bookings = getDemoBookings();
    return NextResponse.json(bookings);
  } catch (err) {
    console.error('Get workshop bookings error:', err);
    return NextResponse.json({ error: 'Помилка отримання записів' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate limiting: 10 bookings per 10 minutes per IP
    const rateLimitResponse = applyRateLimit(request, 'workshop-booking', 10, 10 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { isValid, errors, sanitized } = validateWorkshopPayload(body);

    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const bookingNumber = `WB-${crypto.randomInt(100000, 999999)}`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newBooking = {
      id: `wb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      booking_number: bookingNumber,
      customer_name: sanitized.customer_name,
      customer_phone: sanitized.customer_phone,
      customer_email: sanitized.customer_email || '',
      workshop_title: sanitized.workshop_title,
      participants_count: sanitized.participants_count,
      participant_age: sanitized.participant_age,
      preferred_date: sanitized.preferred_date,
      preferred_time: sanitized.preferred_time,
      notes: sanitized.notes || '',
      status: 'new',
      created_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { error: dbError } = await supabase.from('workshop_bookings').insert([
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

        if (dbError) {
          console.error('Supabase booking insert error:', dbError);
          return NextResponse.json(
            { error: 'Помилка збереження запису в базі даних. Спробуйте пізніше.' },
            { status: 503 }
          );
        }
      } catch (dbErr) {
        console.error('Supabase booking exception:', dbErr);
        return NextResponse.json(
          { error: 'Помилка з’єднання з базою даних. Спробуйте пізніше.' },
          { status: 503 }
        );
      }
    } else {
      addDemoBooking(newBooking);
    }

    return NextResponse.json({
      success: true,
      bookingNumber,
      booking: newBooking,
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
        .from('workshop_bookings')
        .update({ status })
        .or(`id.eq.${id},booking_number.eq.${id}`);

      if (error) {
        console.error('Supabase workshop booking update error:', error);
        return NextResponse.json({ error: 'Помилка оновлення статусу в базі даних' }, { status: 503 });
      }

      return NextResponse.json({ success: true, id, status });
    }

    const updated = updateDemoBookingStatus(id, status);
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error('Workshop booking patch error:', err);
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
      return NextResponse.json({ error: 'ID запису обов’язковий' }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('workshop_bookings')
        .delete()
        .or(`id.eq.${id},booking_number.eq.${id}`);

      if (error) {
        console.error('Supabase workshop booking delete error:', error);
        return NextResponse.json({ error: 'Помилка видалення запису з бази даних' }, { status: 503 });
      }

      return NextResponse.json({ success: true });
    }

    const ok = deleteDemoBooking(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Workshop booking delete error:', err);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
