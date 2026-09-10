import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/lib/products-store';
import { requireAdmin } from '@/lib/auth';
import { validateProductPayload, sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production' && !isSupabaseAdminConfigured) {
      return NextResponse.json(
        { error: 'Служба товарів тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    if (isSupabaseAdminConfigured) {
      const { data: dbProducts, error } = await supabaseAdmin
        .from('products')
        .select('*, categories(name, slug)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get products error:', error.message);
        return NextResponse.json(
          { error: 'Помилка отримання товарів' },
          { status: 503 }
        );
      }
      const formatted = (dbProducts || []).map((p) => ({
        ...p,
        category_name: p.categories?.name || p.category_name || null,
        category_slug: p.categories?.slug || p.category_slug || null,
      }));
      return NextResponse.json(formatted);
    }

    const products = getProducts();
    return NextResponse.json(products);
  } catch (err) {
    console.error('Get products error:', err.message);
    return NextResponse.json(
      { error: 'Не вдалося отримати список товарів' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // 1. Enforce Admin Authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // 2. Parse & Validate Payload
    const body = await request.json();
    const { isValid, errors, sanitized } = validateProductPayload(body);

    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const slug = sanitized.name
      .toLowerCase()
      .replace(/[^a-z0-9а-яіїєґ]+/g, '-')
      .replace(/^-+|-+$/g, '') || `product-${Date.now()}`;

    const newProduct = {
      id: `prod-${Date.now()}`,
      name: sanitized.name,
      slug,
      sku: sanitized.sku || `CS-ART-${Date.now().toString().slice(-4)}`,
      price: sanitized.price,
      stock: sanitized.stock,
      status: sanitized.status,
      category_id: sanitized.category_id,
      category_name: sanitized.category_name,
      brand: 'CreaSphere Craft',
      material: sanitized.material || 'Ручна робота',
      dimensions: sanitized.dimensions,
      production_time: sanitized.production_time,
      description: sanitized.description || 'Унікальний авторський виріб ручної роботи майстрів CreaSphere.',
      images: sanitized.images,
    };

    if (isSupabaseAdminConfigured) {
      const isCatUuid = sanitized.category_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sanitized.category_id);
      const insertData = {
        name: newProduct.name,
        slug: newProduct.slug,
        sku: newProduct.sku,
        description: newProduct.description,
        price: newProduct.price,
        stock: newProduct.stock,
        brand: newProduct.brand,
        material: newProduct.material,
        dimensions: newProduct.dimensions,
        images: newProduct.images,
        status: (newProduct.status === 'in_stock' || !newProduct.status) ? 'active' : newProduct.status,
      };
      if (isCatUuid) {
        insertData.category_id = sanitized.category_id;
      }

      const { data: dbProduct, error } = await supabaseAdmin
        .from('products')
        .insert([insertData])
        .select('*, categories(name, slug)')
        .single();

      if (error || !dbProduct) {
        console.error('Supabase product insert error:', error.message);
        return NextResponse.json(
          { error: 'Помилка збереження товару в базі даних' },
          { status: 503 }
        );
      }

      const formatted = {
        ...dbProduct,
        category_name: dbProduct.categories?.name || dbProduct.category_name || sanitized.category_name,
      };

      return NextResponse.json({
        success: true,
        product: formatted,
        message: 'Товар успішно додано!',
      });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба збереження товарів тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    addProduct(newProduct);

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: 'Товар успішно додано!',
    });
  } catch (err) {
    console.error('Add product API error:', err.message);
    return NextResponse.json(
      { error: 'Помилка при збереженні товару' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // 1. Enforce Admin Authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // 2. Parse & Validate
    const body = await request.json();
    const id = sanitizeString(body.id, 60);

    if (!id) {
      return NextResponse.json({ error: 'ID товару обов’язковий' }, { status: 400 });
    }

    const { isValid, errors, sanitized } = validateProductPayload(body);
    if (!isValid) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const isCatUuid = sanitized.category_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sanitized.category_id);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const updateData = {
        name: sanitized.name,
        price: sanitized.price,
        stock: sanitized.stock,
        status: (sanitized.status === 'in_stock' || !sanitized.status) ? 'active' : sanitized.status,
        material: sanitized.material,
        dimensions: sanitized.dimensions,
        description: sanitized.description,
        images: sanitized.images,
        updated_at: new Date().toISOString(),
      };
      if (isCatUuid) {
        updateData.category_id = sanitized.category_id;
      }

      let query = supabaseAdmin
        .from('products')
        .update(updateData);

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.or(`sku.eq.${id},slug.eq.${id}`);
      }

      const { data: dbUpdated, error } = await query.select('*, categories(name, slug)').single();

      if (error) {
        console.error('Supabase product update error:', error.message);
        return NextResponse.json({ error: 'Помилка оновлення товару в базі даних' }, { status: 503 });
      }

      const formatted = {
        ...dbUpdated,
        category_name: dbUpdated.categories?.name || dbUpdated.category_name || sanitized.category_name,
      };

      return NextResponse.json({
        success: true,
        product: formatted,
        message: 'Товар оновлено!',
      });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба оновлення товарів тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    const updated = updateProduct(id, sanitized);

    return NextResponse.json({
      success: true,
      product: updated,
      message: 'Товар оновлено!',
    });
  } catch (err) {
    console.error('Update product API error:', err.message);
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
      return NextResponse.json({ error: 'ID товару обов’язковий' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseAdmin.from('products').delete();

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.or(`sku.eq.${id},slug.eq.${id}`);
      }

      const { data: deletedRows, error } = await query.select('id, sku, slug');

      if (error) {
        console.error('Supabase product delete error:', error.message);
        return NextResponse.json({ error: 'Помилка видалення товару з бази даних' }, { status: 503 });
      }

      // Also clean up local store if in non-production
      if (process.env.NODE_ENV !== 'production') {
        try {
          deleteProduct(id);
          if (Array.isArray(deletedRows)) {
            for (const r of deletedRows) {
              if (r.sku) deleteProduct(r.sku);
              if (r.slug) deleteProduct(r.slug);
              if (r.id) deleteProduct(r.id);
            }
          }
        } catch (e) {}
      }

      return NextResponse.json({ success: true });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Служба видалення товарів тимчасово недоступна в production' },
        { status: 503 }
      );
    }

    const ok = deleteProduct(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Delete product API error:', err.message);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
