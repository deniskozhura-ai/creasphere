import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { getSpaceBookings, addSpaceBooking, updateSpaceBookingStatus, deleteSpaceBooking } from '@/lib/space-bookings-store';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateSpaceBookingPayload, sanitizeString } from '@/lib/validation';

export async function GET(request) {
  try {
    // 1. Enforce Admin Authorization (Protect Customer PII!)
    const authError = await requireAdmin(request);
    if (authError) return authError;

    if (isSupabaseAdminConfigured) {
      const { data: dbBookings, error } = await supabaseAdmin
        .from('space_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get space bookings error:', error.message);
        return NextResponse.json(
          { error: 'Помилка завантаження заявок на оренду' },
          { status: 500 }
        );
      }
      return NextResponse.json(dbBookings || []);
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба бронювання простору тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    const bookings = getSpaceBookings();
    return NextResponse.json(bookings);
  } catch (err) {
    console.error('Get space bookings error:', err.message);
    return NextResponse.json({ error: 'Помилка завантаження' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate Limiting: 10 booking requests per 10 minutes per IP + endpoint
    const rateLimitResponse = await applyRateLimit(request, 'space-booking', 10, 10 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // 2. Strict Input Validation & XSS Sanitization
    const { isValid, errors, sanitized } = validateSpaceBookingPayload(body);
    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const bookingNumber = `SB-${year}-${randomHex}`;

    const now = new Date().toISOString();

    const newBooking = {
      id: `sb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      booking_number: bookingNumber,
      customer_name: sanitized.customer_name,
      customer_phone: sanitized.customer_phone,
      customer_email: sanitized.customer_email || '',
      tariff: sanitized.tariff,
      event_type: sanitized.event_type || '',
      event_date: sanitized.event_date || '',
      event_time: sanitized.event_time || '',
      duration_hours: sanitized.duration_hours,
      guests_count: sanitized.guests_count,
      notes: sanitized.notes || '',
      status: 'new',
      created_at: now,
    };

    if (isSupabaseAdminConfigured) {
      try {
        const { error: dbError } = await supabaseAdmin.from('space_bookings').insert([
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
          console.error('Supabase space booking insert error:', dbError.message);
          return NextResponse.json(
            { error: 'Помилка збереження заявки в базі даних.' },
            { status: 503 }
          );
        }
      } catch (dbErr) {
        console.error('Supabase space booking exception:', dbErr.message);
        return NextResponse.json(
          { error: 'Помилка при створенні заявки. Спробуйте пізніше.' },
          { status: 503 }
        );
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Служба бронювання простору тимчасово недоступна в production' },
          { status: 503 }
        );
      }
      addSpaceBooking(newBooking);
    }

    // Return strictly minimal confirmation without customer PII
    return NextResponse.json({
      success: true,
      bookingNumber,
      message: 'Заявку на оренду успішно надіслано!',
    });
  } catch (err) {
    console.error('Space booking error:', err.message);
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
      return NextResponse.json({ error: 'Недійсні параметри зміни статусу' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('space_bookings').update({ status });

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('booking_number', id);
      }

      const { error } = await query;

      if (error) {
        console.error('Supabase space booking update error:', error.message);
        return NextResponse.json({ error: 'Помилка оновлення статусу в базі даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true, id, status });
    }

    const updated = updateSpaceBookingStatus(id, status);
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error('Space booking patch error:', err.message);
    return NextResponse.json({ error: 'Помилка оновлення заявки' }, { status: 500 });
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

    if (isSupabaseAdminConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('space_bookings').delete();

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('booking_number', id);
      }

      const { error } = await query;

      if (error) {
        console.error('Supabase space booking delete error:', error.message);
        return NextResponse.json({ error: 'Помилка видалення заявки з бази даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true });
    }

    const ok = deleteSpaceBooking(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Space booking delete error:', err.message);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
