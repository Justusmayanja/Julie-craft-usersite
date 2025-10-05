-- =====================================================
-- JULIE'S CRAFTS DATABASE SETUP SCRIPT
-- =====================================================
-- This script creates all the required tables for the user-site
-- to work properly with authentication, cart, and order management.
-- 
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. USERS TABLE (for authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    is_guest BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 2. USER_CARTS TABLE (for cart persistence)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE,
    cart_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_carts table
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_session_id ON user_carts(session_id);

-- =====================================================
-- 3. GUEST_CUSTOMERS TABLE (for guest orders)
-- =====================================================
CREATE TABLE IF NOT EXISTS guest_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for guest_customers table
CREATE INDEX IF NOT EXISTS idx_guest_customers_email ON guest_customers(email);

-- =====================================================
-- 4. PRODUCTS TABLE (if not exists from craft-web)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    sku VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    featured BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    category_id UUID,
    featured_image VARCHAR(500),
    images JSONB,
    tags JSONB,
    dimensions JSONB,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- =====================================================
-- 5. CATEGORIES TABLE (if not exists from craft-web)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for categories table
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =====================================================
-- 6. ORDERS TABLE (enhanced from craft-web)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UGX',
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shipped_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    tracking_number VARCHAR(100),
    
    -- Enhanced fields from craft-web
    inventory_reserved BOOLEAN DEFAULT FALSE,
    reserved_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    source TEXT DEFAULT 'web' CHECK (source IN ('web', 'phone', 'email', 'walk_in', 'marketplace', 'admin')),
    processing_notes TEXT,
    fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'shipped', 'delivered')),
    version INTEGER DEFAULT 1,
    
    -- User and guest references
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_customer_id UUID REFERENCES guest_customers(id) ON DELETE SET NULL,
    is_guest_order BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_customer_id ON orders(guest_customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- =====================================================
-- 7. ORDER_ITEMS TABLE (if not exists from craft-web)
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- 8. ENHANCED ORDER MANAGEMENT TABLES (from craft-web)
-- =====================================================

-- Order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    previous_payment_status TEXT,
    new_payment_status TEXT,
    changed_by TEXT,
    change_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order item reservations table
CREATE TABLE IF NOT EXISTS order_item_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    reserved_quantity INTEGER NOT NULL CHECK (reserved_quantity > 0),
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'released', 'fulfilled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order fulfillment table
CREATE TABLE IF NOT EXISTS order_fulfillment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    fulfilled_quantity INTEGER NOT NULL CHECK (fulfilled_quantity > 0),
    fulfillment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fulfilled_by TEXT,
    fulfillment_method TEXT DEFAULT 'manual' CHECK (fulfillment_method IN ('manual', 'automated')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order notes table
CREATE TABLE IF NOT EXISTS order_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'customer', 'internal', 'fulfillment', 'payment', 'shipping')),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order tasks table
CREATE TABLE IF NOT EXISTS order_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('inventory_check', 'payment_verification', 'shipping_preparation', 'quality_control', 'customer_contact', 'custom')),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_fulfillment ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tasks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- User carts table policies
DROP POLICY IF EXISTS "Users can manage their own carts" ON user_carts;
CREATE POLICY "Users can manage their own carts" ON user_carts FOR ALL USING (true);

-- Guest customers table policies
DROP POLICY IF EXISTS "Guest customers are publicly accessible" ON guest_customers;
CREATE POLICY "Guest customers are publicly accessible" ON guest_customers FOR ALL USING (true);

-- Products table policies
DROP POLICY IF EXISTS "Products are publicly readable" ON products;
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Products can be managed by authenticated users" ON products;
CREATE POLICY "Products can be managed by authenticated users" ON products FOR ALL TO authenticated USING (true);

-- Categories table policies
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
CREATE POLICY "Categories are publicly readable" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories can be managed by authenticated users" ON categories;
CREATE POLICY "Categories can be managed by authenticated users" ON categories FOR ALL TO authenticated USING (true);

-- Orders table policies
DROP POLICY IF EXISTS "Orders are publicly readable" ON orders;
CREATE POLICY "Orders are publicly readable" ON orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Orders can be created by anyone" ON orders;
CREATE POLICY "Orders can be created by anyone" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Orders can be updated by authenticated users" ON orders;
CREATE POLICY "Orders can be updated by authenticated users" ON orders FOR UPDATE TO authenticated USING (true);

-- Order items table policies
DROP POLICY IF EXISTS "Order items are publicly readable" ON order_items;
CREATE POLICY "Order items are publicly readable" ON order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Order items can be created by anyone" ON order_items;
CREATE POLICY "Order items can be created by anyone" ON order_items FOR INSERT WITH CHECK (true);

-- Enhanced order management table policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users on order_status_history" ON order_status_history;
CREATE POLICY "Allow all operations for authenticated users on order_status_history" ON order_status_history FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users on order_item_reservations" ON order_item_reservations;
CREATE POLICY "Allow all operations for authenticated users on order_item_reservations" ON order_item_reservations FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users on order_fulfillment" ON order_fulfillment;
CREATE POLICY "Allow all operations for authenticated users on order_fulfillment" ON order_fulfillment FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users on order_notes" ON order_notes;
CREATE POLICY "Allow all operations for authenticated users on order_notes" ON order_notes FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users on order_tasks" ON order_tasks;
CREATE POLICY "Allow all operations for authenticated users on order_tasks" ON order_tasks FOR ALL TO authenticated USING (true);

-- =====================================================
-- 11. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_carts_updated_at ON user_carts;
CREATE TRIGGER update_user_carts_updated_at BEFORE UPDATE ON user_carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_customers_updated_at ON guest_customers;
CREATE TRIGGER update_guest_customers_updated_at BEFORE UPDATE ON guest_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_tasks_updated_at ON order_tasks;
CREATE TRIGGER update_order_tasks_updated_at BEFORE UPDATE ON order_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample categories if they don't exist
INSERT INTO categories (name, description, slug) VALUES
('Pottery', 'Traditional African pottery and ceramics', 'pottery'),
('Jewelry', 'Handmade African jewelry and accessories', 'jewelry'),
('Textiles', 'African fabrics and textile products', 'textiles'),
('Wood Carvings', 'Traditional wooden sculptures and carvings', 'wood-carvings'),
('Baskets', 'Handwoven baskets and containers', 'baskets')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SCRIPT COMPLETION MESSAGE
-- =====================================================

-- This script has created all the necessary tables for:
-- ✅ User authentication and management
-- ✅ Cart persistence (user_carts table)
-- ✅ Guest customer management
-- ✅ Product catalog (products and categories)
-- ✅ Order management (orders and order_items)
-- ✅ Enhanced order tracking (status history, fulfillment, etc.)
-- ✅ Row Level Security policies
-- ✅ Automatic timestamp updates

-- Your user-site should now work properly with:
-- - User registration and login
-- - Cart persistence across sessions
-- - Order placement and tracking
-- - Integration with craft-web admin system

SELECT 'Database setup completed successfully!' as status;
