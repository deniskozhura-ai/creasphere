-- ===================================================
-- CreaSphere Database Schema & Initial Seed Data
-- Execute this script in your Supabase SQL Editor
-- ===================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  sku VARCHAR(100) UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  compare_at_price DECIMAL(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand VARCHAR(255) DEFAULT 'CreaSphere',
  material VARCHAR(255),
  dimensions VARCHAR(255),
  weight VARCHAR(100),
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  delivery_address TEXT,
  delivery_method VARCHAR(50) DEFAULT 'nova_poshta',
  payment_method VARCHAR(50) DEFAULT 'card',
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL
);

-- 6. Workshop Bookings Table
CREATE TABLE IF NOT EXISTS workshop_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  workshop_title VARCHAR(255) NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 1,
  preferred_date VARCHAR(100),
  preferred_time VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_status ON workshop_bookings(status);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bookings ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Public products are viewable by everyone" ON products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public workshop bookings are viewable by everyone" ON workshop_bookings
  FOR SELECT USING (true);

-- Public insert policy for orders, items & bookings
CREATE POLICY "Public can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert workshop bookings" ON workshop_bookings
  FOR INSERT WITH CHECK (true);

-- ===================================================
-- SEED DATA
-- ===================================================

-- Categories
INSERT INTO categories (id, name, slug, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Подарунки ручної роботи', 'handmade-gifts', 'Унікальні подарунки, створені руками майстрів'),
  ('a0000000-0000-0000-0000-000000000002', 'Сувеніри та декор', 'souvenirs-decor', 'Елементи затишку та пам''ятні подарунки для дому'),
  ('a0000000-0000-0000-0000-000000000003', 'Творчі набори', 'craft-kits', 'Набори для самостійної творчості та майстер-класів'),
  ('a0000000-0000-0000-0000-000000000004', 'Дитячі іграшки', 'toys', 'Екологічні та розвиваючі іграшки ручної роботи')
ON CONFLICT (slug) DO NOTHING;

-- Products
INSERT INTO products (name, slug, sku, description, price, stock, category_id, brand, material, dimensions, images) VALUES
  (
    'Подарунковий бокс «Теплий вечір»',
    'gift-box-warm-evening',
    'CS-GIFT-01',
    'Святковий набір ручної роботи: ароматична соєва свічка, крафтовий чай, авторське печиво та листівка ручної роботи.',
    750.00,
    12,
    'a0000000-0000-0000-0000-000000000001',
    'CreaSphere',
    'Крафтовий картон, натуральний віск',
    '20 × 20 × 10 см',
    ARRAY['/gift_collection.webp', '/hero_products.webp']
  ),
  (
    'Керамічна чашка «Павлоградські світанки»',
    'ceramic-cup-pavlograd',
    'CS-CER-02',
    'Ексклюзивна чашка з авторським розписом ручної роботи. Кожен екземпляр унікальний.',
    380.00,
    8,
    'a0000000-0000-0000-0000-000000000002',
    'КреаСфера Арт',
    'Кераміка, глазур',
    '350 мл',
    ARRAY['/gallery1.jpg', '/gallery2.jpg']
  ),
  (
    'Набір для творчості «Юний Скульптор»',
    'kit-young-sculptor',
    'CS-KIT-03',
    'Повний набір матеріалів для ліплення та створення власної керамічної фігурки. Включає глину, стеки, фарби та детальну інструкцію.',
    520.00,
    15,
    'a0000000-0000-0000-0000-000000000003',
    'CreaSphere Kids',
    'Глина, акрил, дерево',
    '25 × 18 × 8 см',
    ARRAY['/kids_workshop.webp', '/workshop1.jpg']
  ),
  (
    'Текстильний ведмедик «Тіммі»',
    'textile-bear-timmy',
    'CS-TOY-04',
    'Чарівний ведмедик ручної роботи з гіпоалергенних матеріалів. Стане найкращим другом вашого малюка.',
    640.00,
    5,
    'a0000000-0000-0000-0000-000000000004',
    'Майстерня CreaSphere',
    '100% бавовна, холлофайбер',
    'Висота 28 см',
    ARRAY['/hero_products.webp', '/gallery4.jpg']
  ),
  (
    'Ароматична свічка «Лавандовий сад»',
    'candle-lavender-garden',
    'CS-CND-05',
    'Свічка зі 100% соєвого воску з ароматом французької лаванди та бавовняним ґнотом. Час горіння до 40 годин.',
    320.00,
    20,
    'a0000000-0000-0000-0000-000000000002',
    'CreaSphere Home',
    'Соєвий віск, ефірні олії',
    '200 мл',
    ARRAY['/gallery3.jpg', '/gallery5.jpg']
  ),
  (
    'Набір для створення картини з мозаїки',
    'kit-mosaic-art',
    'CS-KIT-06',
    'Набір містить дерев''яну основу, шматочки скляної та керамічної мозаїки, клей, затирку та покрокове відео-керівництво.',
    690.00,
    7,
    'a0000000-0000-0000-0000-000000000003',
    'CreaSphere',
    'Дерево, кольорове скло, кераміка',
    '20 × 20 см',
    ARRAY['/craft_hands.webp', '/workshop2.jpg']
  )
ON CONFLICT (slug) DO NOTHING;
