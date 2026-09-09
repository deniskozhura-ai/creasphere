-- ===================================================
-- CreaSphere Database Schema & Row Level Security (RLS)
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

-- 7. Space Bookings Table
CREATE TABLE IF NOT EXISTS space_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  tariff VARCHAR(100) NOT NULL,
  date VARCHAR(100),
  time VARCHAR(100),
  people_count INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Custom Orders Table
CREATE TABLE IF NOT EXISTS custom_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  category VARCHAR(100),
  budget VARCHAR(100),
  deadline VARCHAR(100),
  description TEXT,
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
CREATE INDEX IF NOT EXISTS idx_space_bookings_status ON space_bookings(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------
-- TABLE: categories
-- SELECT: Public (anyone can browse categories)
-- INSERT, UPDATE, DELETE: Service role / Admin only
-- ---------------------------------------------------
CREATE POLICY "Public categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- ---------------------------------------------------
-- TABLE: products
-- SELECT: Public (active products only)
-- INSERT, UPDATE, DELETE: Service role / Admin only (NO public mutation!)
-- ---------------------------------------------------
CREATE POLICY "Public products are viewable by everyone" ON products
  FOR SELECT USING (status = 'active');

-- ---------------------------------------------------
-- TABLE: orders
-- SELECT: DENIED to public. ONLY authenticated Admin / Service Role can view customer orders and PII!
-- INSERT: Public allowed for checkout (with strict validation constraints)
-- UPDATE: DENIED to public. Only Admin / Service Role.
-- DELETE: DENIED to public. Only Admin / Service Role.
-- ---------------------------------------------------
CREATE POLICY "Public can insert orders with validation" ON orders
  FOR INSERT WITH CHECK (
    total_amount > 0 AND 
    length(customer_name) >= 2 AND 
    length(customer_phone) >= 9
  );

-- ---------------------------------------------------
-- TABLE: order_items
-- SELECT: DENIED to public.
-- INSERT: Public allowed for checkout (with valid positive quantity and price)
-- UPDATE: DENIED to public.
-- DELETE: DENIED to public.
-- ---------------------------------------------------
CREATE POLICY "Public can insert order items with validation" ON order_items
  FOR INSERT WITH CHECK (
    quantity > 0 AND 
    price >= 0
  );

-- ---------------------------------------------------
-- TABLE: workshop_bookings
-- SELECT: DENIED to public. Customer PII (name, phone, email, notes) is protected!
-- INSERT: Public allowed to submit booking inquiry
-- UPDATE: DENIED to public.
-- DELETE: DENIED to public.
-- ---------------------------------------------------
CREATE POLICY "Public can insert workshop bookings" ON workshop_bookings
  FOR INSERT WITH CHECK (
    length(customer_name) >= 2 AND 
    length(customer_phone) >= 9 AND 
    participants_count >= 1
  );

-- ---------------------------------------------------
-- TABLE: space_bookings
-- SELECT: DENIED to public.
-- INSERT: Public allowed to submit rental inquiry
-- UPDATE: DENIED to public.
-- DELETE: DENIED to public.
-- ---------------------------------------------------
CREATE POLICY "Public can insert space bookings" ON space_bookings
  FOR INSERT WITH CHECK (
    length(customer_name) >= 2 AND 
    length(customer_phone) >= 9
  );

-- ---------------------------------------------------
-- TABLE: custom_orders
-- SELECT: DENIED to public.
-- INSERT: Public allowed to submit custom order request
-- UPDATE: DENIED to public.
-- DELETE: DENIED to public.
-- ---------------------------------------------------
CREATE POLICY "Public can insert custom orders" ON custom_orders
  FOR INSERT WITH CHECK (
    length(customer_name) >= 2 AND 
    length(customer_phone) >= 9
  );

-- Service role full access bypasses RLS automatically in Supabase,
-- so API routes using service key have full administrative management capabilities.
