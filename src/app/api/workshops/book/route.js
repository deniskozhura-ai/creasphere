import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { getDemoBookings, addDemoBooking, updateDemoBookingStatus, deleteDemoBooking } from '@/lib/bookings-store';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateWorkshopBookingPayload, sanitizeString } from '@/lib/validation';

export async function GET(request) {
  try {
    // 1. Enforce Admin Authorization (Protect Customer PII!)
    const authError = await requireAdmin(request);
    if (authError) return authError;

    if (isSupabaseAdminConfigured) {
      const { data: dbBookings, error } = await supabaseAdmin
        .from('workshop_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get workshop bookings error:', error.message);
        return NextResponse.json(
          { error: 'Помилка завантаження записів на майстер-класи' },
          { status: 500 }
        );
      }
      return NextResponse.json(dbBookings || []);
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба записів на майстер-класи тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    const bookings = getDemoBookings();
    return NextResponse.json(bookings);
  } catch (err) {
    console.error('Get workshop bookings error:', err.message);
    return NextResponse.json({ error: 'Помилка завантаження' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate Limiting: 10 booking requests per 10 minutes per IP + endpoint
    const ip = getClientIp(request);
    const rateLimitResponse = await applyRateLimit(request, `workshop-booking:${ip}`, 10, 10 * 60 * 1000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // 2. Strict Input Validation & XSS Sanitization
    const { isValid, errors, sanitized } = validateWorkshopBookingPayload(body);
    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const bookingNumber = `WB-${year}-${randomHex}`;

    const now = new Date().toISOString();

    const newBooking = {
      id: `wb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      booking_number: bookingNumber,
      customer_name: sanitized.customer_name,
      customer_phone: sanitized.customer_phone,
      customer_email: sanitized.customer_email || '',
      workshop_title: sanitized.workshop_title,
      participants_count: sanitized.participants_count,
      participant_age: sanitized.participant_age || '',
      preferred_date: sanitized.preferred_date || '',
      preferred_time: sanitized.preferred_time || '',
      notes: sanitized.notes || '',
      status: 'new',
      created_at: now,
    };

    if (isSupabaseAdminConfigured) {
      try {
        const { error: dbError } = await supabaseAdmin.from('workshop_bookings').insert([
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
          console.error('Supabase booking insert error:', dbError.message);
          return NextResponse.json(
            { error: 'Помилка збереження запису в базі даних.' },
            { status: 503 }
          );
        }
      } catch (dbErr) {
        console.error('Supabase booking exception:', dbErr.message);
        return NextResponse.json(
          { error: 'Помилка збереження запису. Спробуйте пізніше.' },
          { status: 503 }
        );
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Служба збереження записів тимчасово недоступна в production' },
          { status: 503 }
        );
      }
      addDemoBooking(newBooking);
    }

    // Return strictly minimal confirmation without customer PII
    return NextResponse.json({
      success: true,
      bookingNumber,
      message: 'Запис на майстер-клас успішно оформлено!',
    });
  } catch (err) {
    console.error('Workshop booking error:', err.message);
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
      return NextResponse.json({ error: 'Недійсні параметри зміни статусу' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const { error } = await supabaseAdmin
        .from('workshop_bookings')
        .update({ status })
        .or(`id.eq.${id},booking_number.eq.${id}`);

      if (error) {
        console.error('Supabase booking update error:', error.message);
        return NextResponse.json({ error: 'Помилка оновлення статусу в базі даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true, id, status });
    }

    const updated = updateDemoBookingStatus(id, status);
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error('Workshop booking patch error:', err.message);
    return NextResponse.json({ error: 'Помилка оновлення запису' }, { status: 500 });
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

    if (isSupabaseAdminConfigured) {
      const { error } = await supabaseAdmin
        .from('workshop_bookings')
        .delete()
        .or(`id.eq.${id},booking_number.eq.${id}`);

      if (error) {
        console.error('Supabase booking delete error:', error.message);
        return NextResponse.json({ error: 'Помилка видалення запису з бази даних' }, { status: 503 });
      }
      return NextResponse.json({ success: true });
    }

    const ok = deleteDemoBooking(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Workshop booking delete error:', err.message);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
