-- ===================================================
-- CreaSphere Database Schema & Row Level Security (RLS)
-- Stage 2 Security Hardening
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
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
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

-- 4. Orders Table (order_number UNIQUE NOT NULL)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  delivery_address TEXT,
  delivery_method VARCHAR(50) DEFAULT 'nova_poshta',
  payment_method VARCHAR(50) DEFAULT 'card',
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
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
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0)
);

-- 6. Workshop Bookings Table
CREATE TABLE IF NOT EXISTS workshop_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  workshop_title VARCHAR(255) NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 1 CHECK (participants_count > 0),
  participant_age VARCHAR(100),
  preferred_date VARCHAR(100),
  preferred_time VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure participant_age column exists if table was already created
ALTER TABLE workshop_bookings ADD COLUMN IF NOT EXISTS participant_age VARCHAR(100);

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
  people_count INTEGER NOT NULL DEFAULT 1 CHECK (people_count > 0),
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

-- 9. Admin Sessions Table (Persistent serverless sessions with SHA-256 token hashing)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- 10. Distributed Rate Limits Table
CREATE TABLE IF NOT EXISTS rate_limits (
  key VARCHAR(255) PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at BIGINT NOT NULL
);

-- 11. Workshops Catalog & Schedule Table
CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  duration VARCHAR(100),
  price VARCHAR(100),
  difficulty VARCHAR(100),
  difficulty_level VARCHAR(50) DEFAULT 'beginner',
  max_participants INTEGER DEFAULT 10,
  registered_count INTEGER DEFAULT 0,
  available_spots INTEGER DEFAULT 10,
  age VARCHAR(100),
  image TEXT,
  badge VARCHAR(100),
  scheduled_dates TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance & rapid security lookups
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_workshops_status ON workshops(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_status ON workshop_bookings(status);
CREATE INDEX IF NOT EXISTS idx_space_bookings_status ON space_bookings(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------
-- TABLE: categories
-- SELECT: Public (anyone can browse categories)
-- INSERT, UPDATE, DELETE: Service role / Admin only
-- ---------------------------------------------------
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON categories;
CREATE POLICY "Public categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- ---------------------------------------------------
-- TABLE: workshops
-- SELECT: Public (active workshops only)
-- INSERT, UPDATE, DELETE: Service role / Admin only
-- ---------------------------------------------------
DROP POLICY IF EXISTS "Public workshops are viewable by everyone" ON workshops;
CREATE POLICY "Public workshops are viewable by everyone" ON workshops
  FOR SELECT USING (status = 'active');

-- ---------------------------------------------------
-- TABLE: products
-- SELECT: Public (active products only)
-- INSERT, UPDATE, DELETE: Service role / Admin only (NO public mutation!)
-- ---------------------------------------------------
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON products;
CREATE POLICY "Public products are viewable by everyone" ON products
  FOR SELECT USING (status = 'active');

-- ---------------------------------------------------
-- TABLE: orders & order_items
-- PUBLIC ACCESS: COMPLETELY CLOSED!
-- No public SELECT, INSERT, UPDATE, or DELETE!
-- All orders MUST be placed via POST /api/orders running with service role.
-- This guarantees:
-- 1. Server-authoritative pricing (client cannot set fake price/total).
-- 2. Input validation & sanitization.
-- 3. Atomic stock verification and decrement.
-- 4. PII protection (customers cannot query other customers' orders).
-- ---------------------------------------------------
DROP POLICY IF EXISTS "Public can insert orders with validation" ON orders;
DROP POLICY IF EXISTS "Public can insert order items with validation" ON order_items;

-- ---------------------------------------------------
-- TABLE: workshop_bookings, space_bookings, custom_orders
-- PUBLIC SELECT: STRICTLY DENIED (Customer PII protection!)
-- PUBLIC UPDATE/DELETE: STRICTLY DENIED
-- All bookings and custom orders must go through API routes with service role.
-- ---------------------------------------------------
DROP POLICY IF EXISTS "Public can insert workshop bookings" ON workshop_bookings;
DROP POLICY IF EXISTS "Public can insert space bookings" ON space_bookings;
DROP POLICY IF EXISTS "Public can insert custom orders" ON custom_orders;

-- ---------------------------------------------------
-- TABLE: admin_sessions & rate_limits
-- PUBLIC ACCESS: STRICTLY DENIED. Only accessible by service role.
-- ---------------------------------------------------

-- ===================================================
-- STORED PROCEDURES / ATOMIC FUNCTIONS
-- ===================================================

-- 1. Atomic Rate Limiter Function
-- Hardened with empty search_path and fully qualified object names
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key VARCHAR(255),
  p_max_requests INTEGER,
  p_window_ms BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now BIGINT := (pg_catalog.date_part('epoch', pg_catalog.now()) * 1000)::BIGINT;
  v_record RECORD;
BEGIN
  SELECT count, reset_at INTO v_record
  FROM public.rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND OR v_record.reset_at < v_now THEN
    INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_now + p_window_ms)
    ON CONFLICT (key) DO UPDATE
    SET count = 1, reset_at = v_now + p_window_ms;

    RETURN pg_catalog.jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1, 'retryAfter', 0);
  END IF;

  IF v_record.count >= p_max_requests THEN
    RETURN pg_catalog.jsonb_build_object('allowed', false, 'remaining', 0, 'retryAfter', pg_catalog.ceil((v_record.reset_at - v_now) / 1000.0)::INTEGER);
  END IF;

  UPDATE public.rate_limits
  SET count = count + 1
  WHERE key = p_key;

  RETURN pg_catalog.jsonb_build_object('allowed', true, 'remaining', p_max_requests - (v_record.count + 1), 'retryAfter', 0);
END;
$$;

-- REVOKE direct execution from PUBLIC, anon, and authenticated roles!
-- Only service_role can execute rate limiting check
REVOKE ALL ON FUNCTION public.check_rate_limit(VARCHAR, INTEGER, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(VARCHAR, INTEGER, BIGINT) TO service_role;

-- 2. Atomic Order Creation Function with Stock Row-Locking (FOR UPDATE)
-- Hardened with empty search_path and fully qualified object names
-- Solves:
-- - Price manipulation (reads real catalog price)
-- - Race condition in stock (FOR UPDATE locks row and decrements atomically)
-- - Partial failure (transaction rolls back all changes if any item fails)
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_number VARCHAR(100),
  p_customer_name VARCHAR(255),
  p_customer_phone VARCHAR(50),
  p_customer_email VARCHAR(255),
  p_delivery_address TEXT,
  p_delivery_method VARCHAR(50),
  p_payment_method VARCHAR(50),
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_requested_qty INTEGER;
  v_current_stock INTEGER;
  v_product_name VARCHAR(255);
  v_product_price DECIMAL(10, 2);
  v_product_status VARCHAR(50);
  v_item_total DECIMAL(10, 2);
  v_calc_total DECIMAL(10, 2) := 0.00;
BEGIN
  -- Validate uniqueness of order_number
  IF EXISTS (SELECT 1 FROM public.orders WHERE order_number = p_order_number) THEN
    RAISE EXCEPTION 'ORDER_NUMBER_COLLISION: %', p_order_number;
  END IF;

  -- Validate non-empty items
  IF p_items IS NULL OR pg_catalog.jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_ORDER_ITEMS';
  END IF;

  -- Pre-insert order container
  INSERT INTO public.orders (
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    delivery_method,
    payment_method,
    total_amount,
    status,
    notes
  ) VALUES (
    p_order_number,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_delivery_address,
    p_delivery_method,
    p_payment_method,
    0.00,
    'pending',
    p_notes
  ) RETURNING id INTO v_order_id;

  -- Process and lock each product row
  FOR v_item IN SELECT * FROM pg_catalog.jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::UUID;
    v_requested_qty := (v_item->>'quantity')::INTEGER;

    IF v_requested_qty IS NULL OR v_requested_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY for product %', v_product_id;
    END IF;

    -- Row-level lock FOR UPDATE prevents race conditions across concurrent checkouts
    SELECT name, price, stock, status
    INTO v_product_name, v_product_price, v_current_stock, v_product_status
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND: %', v_product_id;
    END IF;

    -- Check stock availability
    IF v_product_status <> 'pre_order' AND v_current_stock < v_requested_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: % (available: %, requested: %)', v_product_name, v_current_stock, v_requested_qty;
    END IF;

    -- Decrement stock atomically if not pre_order
    IF v_product_status <> 'pre_order' THEN
      UPDATE public.products
      SET stock = stock - v_requested_qty,
          updated_at = pg_catalog.now()
      WHERE id = v_product_id;
    END IF;

    -- Authoritative server pricing
    v_item_total := pg_catalog.round((v_product_price * v_requested_qty)::numeric, 2);
    v_calc_total := v_calc_total + v_item_total;

    -- Insert order item
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      price,
      total
    ) VALUES (
      v_order_id,
      v_product_id,
      v_product_name,
      v_requested_qty,
      v_product_price,
      v_item_total
    );
  END LOOP;

  -- Set final server-calculated total
  UPDATE public.orders
  SET total_amount = v_calc_total
  WHERE id = v_order_id;

  -- Return minimal non-PII confirmation
  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order_number,
    'total_amount', v_calc_total
  );
END;
$$;

-- REVOKE direct execution from PUBLIC, anon, and authenticated roles!
-- Only service_role can execute atomic order creation
REVOKE ALL ON FUNCTION public.create_order_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, TEXT, JSONB) TO service_role;

-- 3. Atomic Workshop Booking Function with Capacity Check & Row Locking
CREATE OR REPLACE FUNCTION public.book_workshop_atomic(
  p_booking_number VARCHAR(100),
  p_customer_name VARCHAR(255),
  p_customer_phone VARCHAR(50),
  p_customer_email VARCHAR(255),
  p_workshop_title VARCHAR(255),
  p_participants_count INTEGER,
  p_participant_age VARCHAR(100),
  p_preferred_date VARCHAR(100),
  p_preferred_time VARCHAR(100),
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking_id UUID;
  v_workshop_id UUID;
  v_max_participants INTEGER;
  v_available_spots INTEGER;
  v_status VARCHAR(50);
BEGIN
  -- Validate participants count
  IF p_participants_count IS NULL OR p_participants_count <= 0 THEN
    RAISE EXCEPTION 'INVALID_PARTICIPANTS_COUNT';
  END IF;

  -- Lookup matching workshop by title or slug if exists
  SELECT id, max_participants, available_spots, status
  INTO v_workshop_id, v_max_participants, v_available_spots, v_status
  FROM public.workshops
  WHERE title = p_workshop_title OR slug = p_workshop_title
  FOR UPDATE;

  -- If catalog workshop found, enforce status & capacity
  IF FOUND THEN
    IF v_status <> 'active' THEN
      RAISE EXCEPTION 'WORKSHOP_INACTIVE';
    END IF;

    IF v_available_spots < p_participants_count THEN
      RAISE EXCEPTION 'INSUFFICIENT_SPOTS: requested %, available %', p_participants_count, v_available_spots;
    END IF;

    -- Decrement spots atomically
    UPDATE public.workshops
    SET available_spots = pg_catalog.greatest(0, available_spots - p_participants_count),
        registered_count = registered_count + p_participants_count
    WHERE id = v_workshop_id;
  END IF;

  -- Insert booking
  INSERT INTO public.workshop_bookings (
    booking_number,
    customer_name,
    customer_phone,
    customer_email,
    workshop_title,
    participants_count,
    participant_age,
    preferred_date,
    preferred_time,
    notes,
    status
  ) VALUES (
    p_booking_number,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_workshop_title,
    p_participants_count,
    p_participant_age,
    p_preferred_date,
    p_preferred_time,
    p_notes,
    'new'
  ) RETURNING id INTO v_booking_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_number', p_booking_number
  );
END;
$$;

-- REVOKE direct execution from PUBLIC, anon, and authenticated roles!
REVOKE ALL ON FUNCTION public.book_workshop_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR, VARCHAR, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_workshop_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR, VARCHAR, TEXT) TO service_role;

-- Ensure workshops image column supports custom data URLs and storage URLs
ALTER TABLE IF EXISTS workshops ALTER COLUMN image TYPE TEXT;

-- ===================================================
-- SEED DATA: DEFAULT CATEGORIES
-- ===================================================
INSERT INTO public.categories (name, slug, description)
VALUES
  ('Подарунки ручної роботи', 'handmade-gifts', 'Унікальні подарунки ручної роботи від майстрів CreaSphere'),
  ('Сувеніри та декор', 'decor-souvenirs', 'Затишні сувеніри та предмети декору для дому'),
  ('Творчі набори', 'creative-kits', 'Набори для творчості та самостійного створення шедеврів'),
  ('Дитячі іграшки', 'kids-toys', 'Екологічні та безпечні в’язані та дерев’яні іграшки для дітей')
ON CONFLICT (slug) DO NOTHING;
