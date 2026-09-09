import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/lib/products-store';
import { requireAdmin } from '@/lib/auth';
import { validateProductPayload, sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    if (isSupabaseConfigured) {
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase get products error:', error);
        return NextResponse.json(
          { error: 'Помилка отримання товарів з бази даних' },
          { status: 500 }
        );
      }
      return NextResponse.json(dbProducts || []);
    }

    const products = getProducts();
    return NextResponse.json(products);
  } catch (err) {
    console.error('Get products error:', err);
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

    if (isSupabaseConfigured) {
      const { data: dbProduct, error } = await supabase
        .from('products')
        .insert([
          {
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
            status: newProduct.status,
          },
        ])
        .select()
        .single();

      if (error || !dbProduct) {
        console.error('Supabase product insert error:', error);
        return NextResponse.json(
          { error: 'Помилка збереження товару в базі даних' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        product: dbProduct,
        message: 'Товар успішно додано!',
      });
    }

    addProduct(newProduct);

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: 'Товар успішно додано!',
    });
  } catch (err) {
    console.error('Add product API error:', err);
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

    if (isSupabaseConfigured) {
      const { data: dbUpdated, error } = await supabase
        .from('products')
        .update({
          name: sanitized.name,
          price: sanitized.price,
          stock: sanitized.stock,
          status: sanitized.status,
          material: sanitized.material,
          dimensions: sanitized.dimensions,
          description: sanitized.description,
          images: sanitized.images,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},sku.eq.${id}`)
        .select()
        .single();

      if (error) {
        console.error('Supabase product update error:', error);
        return NextResponse.json({ error: 'Помилка оновлення товару в базі даних' }, { status: 503 });
      }

      return NextResponse.json({
        success: true,
        product: dbUpdated,
        message: 'Товар оновлено!',
      });
    }

    const updated = updateProduct(id, sanitized);

    return NextResponse.json({
      success: true,
      product: updated,
      message: 'Товар оновлено!',
    });
  } catch (err) {
    console.error('Update product API error:', err);
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

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('products')
        .delete()
        .or(`id.eq.${id},sku.eq.${id}`);

      if (error) {
        console.error('Supabase product delete error:', error);
        return NextResponse.json({ error: 'Помилка видалення товару з бази даних' }, { status: 503 });
      }

      return NextResponse.json({ success: true });
    }

    const ok = deleteProduct(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Delete product API error:', err);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
