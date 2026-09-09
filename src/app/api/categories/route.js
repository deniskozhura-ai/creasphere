import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/lib/categories-store';
import { requireAdmin } from '@/lib/auth';
import { sanitizeString } from '@/lib/validation';

const UK_TO_EN = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya',
  А: 'a', Б: 'b', В: 'v', Г: 'h', Ґ: 'g', Д: 'd', Е: 'e', Є: 'ye', Ж: 'zh',
  З: 'z', И: 'y', І: 'i', Ї: 'yi', Й: 'y', К: 'k', Л: 'l', М: 'm', Н: 'n',
  О: 'o', П: 'p', Р: 'r', С: 's', Т: 't', У: 'u', Ф: 'f', Х: 'kh', Ц: 'ts',
  Ч: 'ch', Ш: 'sh', Щ: 'shch', Ь: '', Ю: 'yu', Я: 'ya',
  ы: 'y', э: 'e', ъ: '', Ы: 'y', Э: 'e', Ъ: '',
};

function slugify(text) {
  if (!text) return `cat-${Date.now()}`;
  const transliterated = text
    .toString()
    .split('')
    .map((char) => (UK_TO_EN[char] !== undefined ? UK_TO_EN[char] : char))
    .join('');

  return (
    transliterated
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`
  );
}

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production' && !isSupabaseAdminConfigured) {
      return NextResponse.json(
        { error: 'Служба категорій тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    if (isSupabaseAdminConfigured) {
      const { data: dbCategories, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase get categories error:', error.message);
        return NextResponse.json(
          { error: 'Помилка отримання категорій' },
          { status: 503 }
        );
      }
      return NextResponse.json(dbCategories || []);
    }

    const categories = getCategories();
    return NextResponse.json(categories);
  } catch (err) {
    console.error('Get categories error:', err.message);
    return NextResponse.json(
      { error: 'Не вдалося отримати список категорій' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const name = sanitizeString(body.name, 100);
    const description = sanitizeString(body.description, 500) || '';
    const customSlug = body.slug ? sanitizeString(body.slug, 100) : '';

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Назва категорії повинна містити щонайменше 2 символи' },
        { status: 400 }
      );
    }

    const slug = customSlug ? slugify(customSlug) : slugify(name);

    if (isSupabaseAdminConfigured) {
      const { data: dbCategory, error } = await supabaseAdmin
        .from('categories')
        .insert([
          {
            name,
            slug,
            description,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase category insert error:', error.message);
        if (error.code === '23505' || error.message.includes('unique')) {
          return NextResponse.json(
            { error: 'Категорія з таким ідентифікатором (slug) вже існує' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Помилка збереження категорії в базі даних' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        category: dbCategory,
        message: 'Категорію успішно додано!',
      });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба збереження категорій тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    const newCategory = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      description,
      created_at: new Date().toISOString(),
    };

    addCategory(newCategory);

    return NextResponse.json({
      success: true,
      category: newCategory,
      message: 'Категорію успішно додано!',
    });
  } catch (err) {
    console.error('Add category API error:', err.message);
    return NextResponse.json(
      { error: 'Помилка при додаванні категорії' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const id = sanitizeString(body.id, 60);

    if (!id) {
      return NextResponse.json({ error: 'ID категорії обов’язковий' }, { status: 400 });
    }

    const name = sanitizeString(body.name, 100);
    const description = sanitizeString(body.description, 500) || '';
    const customSlug = body.slug ? sanitizeString(body.slug, 100) : '';

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Назва категорії повинна містити щонайменше 2 символи' },
        { status: 400 }
      );
    }

    const slug = customSlug ? slugify(customSlug) : slugify(name);

    if (isSupabaseAdminConfigured) {
      const { data: dbCategory, error } = await supabaseAdmin
        .from('categories')
        .update({
          name,
          slug,
          description,
        })
        .or(`id.eq.${id},slug.eq.${id}`)
        .select()
        .single();

      if (error) {
        console.error('Supabase category update error:', error.message);
        return NextResponse.json(
          { error: 'Помилка оновлення категорії в базі даних' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        category: dbCategory,
        message: 'Категорію оновлено!',
      });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба оновлення категорій тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    const updated = updateCategory(id, { name, slug, description });

    return NextResponse.json({
      success: true,
      category: updated,
      message: 'Категорію оновлено!',
    });
  } catch (err) {
    console.error('Update category API error:', err.message);
    return NextResponse.json(
      { error: 'Помилка оновлення категорії' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = sanitizeString(searchParams.get('id'), 60);

    if (!id) {
      return NextResponse.json({ error: 'ID категорії обов’язковий' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .or(`id.eq.${id},slug.eq.${id}`);

      if (error) {
        console.error('Supabase category delete error:', error.message);
        return NextResponse.json(
          { error: 'Помилка видалення категорії з бази даних' },
          { status: 503 }
        );
      }

      return NextResponse.json({ success: true, message: 'Категорію видалено!' });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба видалення категорій тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    deleteCategory(id);
    return NextResponse.json({ success: true, message: 'Категорію видалено!' });
  } catch (err) {
    console.error('Delete category API error:', err.message);
    return NextResponse.json(
      { error: 'Помилка видалення категорії' },
      { status: 500 }
    );
  }
}
