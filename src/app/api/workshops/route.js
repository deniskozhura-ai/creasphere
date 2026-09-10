import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/auth';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    if (isSupabaseAdminConfigured) {
      const { data, error } = await supabaseAdmin
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase get workshops error:', error.message);
        return NextResponse.json({ error: 'Помилка завантаження майстер-класів' }, { status: 500 });
      }
      return NextResponse.json(data || []);
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error('Get workshops error:', err.message);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const title = sanitizeString(body.title, 200);
    if (!title || title.length < 2) {
      return NextResponse.json({ error: 'Назва майстер-класу обов’язкова' }, { status: 400 });
    }

    const slug = sanitizeString(body.slug, 100) || title.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/g, '-').replace(/^-+|-+$/g, '') || `workshop-${Date.now()}`;
    const description = sanitizeString(body.description || body.desc, 2000);
    const duration = sanitizeString(body.duration, 100) || '1.5 – 2 години';
    const price = sanitizeString(body.price, 100) || '500 ₴';
    const difficulty = sanitizeString(body.difficulty, 100) || 'Початковий';
    const difficulty_level = sanitizeString(body.difficulty_level || body.difficultyLevel, 50) || 'beginner';
    const age = sanitizeString(body.age, 100) || 'від 6 років та дорослі';
    const image = sanitizeString(body.image, 255) || '/workshop1.jpg';
    const badge = sanitizeString(body.badge, 100);
    const max_participants = Number.isInteger(Number(body.max_participants)) ? Number(body.max_participants) : 10;
    const available_spots = Number.isInteger(Number(body.available_spots)) ? Number(body.available_spots) : 10;
    const scheduled_dates = Array.isArray(body.scheduled_dates) ? body.scheduled_dates.map(d => sanitizeString(d, 100)) : [];
    const status = ['active', 'archived'].includes(body.status) ? body.status : 'active';

    if (isSupabaseAdminConfigured) {
      const { data, error } = await supabaseAdmin
        .from('workshops')
        .insert([{
          title,
          slug,
          description,
          duration,
          price,
          difficulty,
          difficulty_level,
          max_participants,
          available_spots,
          registered_count: 0,
          age,
          image,
          badge,
          scheduled_dates,
          status
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase workshop insert error:', error.message);
        return NextResponse.json({ error: 'Помилка збереження майстер-класу' }, { status: 500 });
      }
      return NextResponse.json({ success: true, workshop: data });
    }

    return NextResponse.json({ error: 'База даних недоступна' }, { status: 503 });
  } catch (err) {
    console.error('Workshop post error:', err.message);
    return NextResponse.json({ error: 'Помилка додавання майстер-класу' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const id = sanitizeString(body.id, 60);
    if (!id) {
      return NextResponse.json({ error: 'ID майстер-класу обов’язковий' }, { status: 400 });
    }

    const title = sanitizeString(body.title, 200);
    const description = sanitizeString(body.description || body.desc, 2000);
    const duration = sanitizeString(body.duration, 100);
    const price = sanitizeString(body.price, 100);
    const difficulty = sanitizeString(body.difficulty, 100);
    const difficulty_level = sanitizeString(body.difficulty_level || body.difficultyLevel, 50);
    const age = sanitizeString(body.age, 100);
    const image = sanitizeString(body.image, 255);
    const badge = sanitizeString(body.badge, 100);
    const max_participants = Number.isInteger(Number(body.max_participants)) ? Number(body.max_participants) : undefined;
    const available_spots = Number.isInteger(Number(body.available_spots)) ? Number(body.available_spots) : undefined;
    const scheduled_dates = Array.isArray(body.scheduled_dates) ? body.scheduled_dates.map(d => sanitizeString(d, 100)) : undefined;
    const status = body.status;

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration) updateData.duration = duration;
    if (price) updateData.price = price;
    if (difficulty) updateData.difficulty = difficulty;
    if (difficulty_level) updateData.difficulty_level = difficulty_level;
    if (age) updateData.age = age;
    if (image) updateData.image = image;
    if (badge !== undefined) updateData.badge = badge;
    if (max_participants !== undefined) updateData.max_participants = max_participants;
    if (available_spots !== undefined) updateData.available_spots = available_spots;
    if (scheduled_dates !== undefined) updateData.scheduled_dates = scheduled_dates;
    if (status) updateData.status = status;

    if (isSupabaseAdminConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('workshops').update(updateData);
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data, error } = await query.select().single();
      if (error) {
        console.error('Supabase workshop update error:', error.message);
        return NextResponse.json({ error: 'Помилка оновлення майстер-класу' }, { status: 500 });
      }
      return NextResponse.json({ success: true, workshop: data });
    }

    return NextResponse.json({ error: 'База даних недоступна' }, { status: 503 });
  } catch (err) {
    console.error('Workshop put error:', err.message);
    return NextResponse.json({ error: 'Помилка оновлення майстер-класу' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = sanitizeString(searchParams.get('id'), 60);
    if (!id) {
      return NextResponse.json({ error: 'ID майстер-класу обов’язковий' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('workshops').delete();
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { error } = await query;
      if (error) {
        console.error('Supabase workshop delete error:', error.message);
        return NextResponse.json({ error: 'Помилка видалення майстер-класу' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Майстер-клас успішно видалено' });
    }

    return NextResponse.json({ error: 'База даних недоступна' }, { status: 503 });
  } catch (err) {
    console.error('Workshop delete error:', err.message);
    return NextResponse.json({ error: 'Помилка видалення майстер-класу' }, { status: 500 });
  }
}
