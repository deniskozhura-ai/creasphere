import { NextResponse } from 'next/server';
import { getProducts, addProduct, deleteProduct } from '@/lib/products-store';

export async function GET() {
  const products = getProducts();
  return NextResponse.json(products);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      category_id,
      category_name,
      price,
      stock,
      status,
      material,
      dimensions,
      production_time,
      description,
      image,
    } = body;

    if (!name?.trim() || !price) {
      return NextResponse.json(
        { error: 'Назва товару та ціна є обов’язковими' },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9а-яіїєґ]+/g, '-')
      .replace(/^-+|-+$/g, '') || `product-${Date.now()}`;

    const newProduct = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      slug,
      sku: sku?.trim() || `CS-ART-${Date.now().toString().slice(-4)}`,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 1,
      status: status || 'in_stock',
      category_id: category_id || '1',
      category_name: category_name || 'Подарунки ручної роботи',
      brand: 'CreaSphere Craft',
      material: material?.trim() || 'Ручна робота',
      dimensions: dimensions?.trim() || '',
      production_time: production_time?.trim() || 'В наявності',
      description: description?.trim() || 'Унікальний авторський виріб ручної роботи майстрів CreaSphere.',
      images: [image?.trim() || '/gift_collection.webp'],
    };

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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID товару обов’язковий' }, { status: 400 });
    }

    const ok = deleteProduct(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
