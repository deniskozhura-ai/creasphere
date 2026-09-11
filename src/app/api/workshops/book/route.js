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
    const rateLimitResponse = await applyRateLimit(request, `workshops:${ip}`, 10, 10 * 60 * 1000);
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
      let matched = null;
      try {
        // 3. Server-side capacity check: Verify available spots & active status
        const { data: matchedWorkshops } = await supabaseAdmin
          .from('workshops')
          .select('id, title, max_participants, available_spots, registered_count, status')
          .or(`title.eq.${sanitized.workshop_title},slug.eq.${sanitized.workshop_title}`);

        matched = Array.isArray(matchedWorkshops) && matchedWorkshops.length > 0 ? matchedWorkshops[0] : null;

        if (matched) {
          if (matched.status !== 'active') {
            return NextResponse.json(
              { error: 'Обраний майстер-клас наразі недоступний для бронювання.' },
              { status: 400 }
            );
          }

          const currentSpots = matched.available_spots !== undefined && matched.available_spots !== null
            ? matched.available_spots
            : (matched.max_participants - (matched.registered_count || 0));

          if (sanitized.participants_count > currentSpots) {
            return NextResponse.json(
              {
                error: `Неможливо зареєструвати ${sanitized.participants_count} учасників. Доступно вільних місць: ${Math.max(0, currentSpots)}.`,
              },
              { status: 400 }
            );
          }

          // Atomically decrement spots and increment registered_count with row condition
          const newSpots = Math.max(0, currentSpots - sanitized.participants_count);
          const newRegistered = (matched.registered_count || 0) + sanitized.participants_count;

          const { data: updatedWorkshop, error: updateSpotsError } = await supabaseAdmin
            .from('workshops')
            .update({
              available_spots: newSpots,
              registered_count: newRegistered,
            })
            .eq('id', matched.id)
            .gte('available_spots', sanitized.participants_count)
            .select()
            .maybeSingle();

          if (updateSpotsError || !updatedWorkshop) {
            return NextResponse.json(
              { error: 'На жаль, недостатньо вільних місць на цей майстер-клас. Спробуйте меншу кількість учасників.' },
              { status: 400 }
            );
          }
        }

        const { error: dbError } = await supabaseAdmin.from('workshop_bookings').insert([
          {
            booking_number: bookingNumber,
            customer_name: newBooking.customer_name,
            customer_phone: newBooking.customer_phone,
            customer_email: newBooking.customer_email,
            workshop_title: newBooking.workshop_title,
            participants_count: newBooking.participants_count,
            participant_age: newBooking.participant_age,
            preferred_date: newBooking.preferred_date,
            preferred_time: newBooking.preferred_time,
            notes: newBooking.notes,
            status: 'new',
          },
        ]);

        if (dbError) {
          // Revert spots if booking insert failed
          if (matched) {
            await supabaseAdmin
              .from('workshops')
              .update({
                available_spots: matched.available_spots,
                registered_count: matched.registered_count,
              })
              .eq('id', matched.id);
          }
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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('workshop_bookings').update({ status });

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('booking_number', id);
      }

      const { error } = await query;

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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('workshop_bookings').delete();

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('booking_number', id);
      }

      const { error } = await query;

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
