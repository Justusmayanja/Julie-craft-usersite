# Database Schema for User Order Management

This document outlines the database tables needed to support comprehensive user order management in the Julie Crafts e-commerce system.

## Core Tables

### 1. `orders` Table
Stores order information for both registered users and guest customers.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UGX',
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_date TIMESTAMP WITH TIME ZONE,
  delivered_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  tracking_number VARCHAR(100),
  is_guest_order BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id), -- For registered users
  session_id VARCHAR(255), -- For guest sessions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. `order_items` Table
Stores individual items within each order.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. `users` Table (Future Enhancement)
For registered user accounts.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255), -- For future authentication
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
```

### 4. `user_sessions` Table
Tracks user sessions for cart persistence and analytics.

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id), -- NULL for guest sessions
  email VARCHAR(255), -- For guest sessions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);
```

### 5. `user_carts` Table
Stores cart data for users and sessions.

```sql
CREATE TABLE user_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), -- NULL for guest sessions
  session_id VARCHAR(255), -- For guest sessions
  cart_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id), -- One cart per registered user
  UNIQUE(session_id) -- One cart per session
);
```

### 6. `guest_customers` Table
Stores information about guest customers for future marketing and re-orders.

```sql
CREATE TABLE guest_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  default_shipping_address JSONB,
  default_billing_address JSONB,
  order_count INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. `user_preferences` Table (Future Enhancement)
Stores user preferences and settings.

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(3) DEFAULT 'UGX',
  language VARCHAR(5) DEFAULT 'en',
  notifications JSONB DEFAULT '{"email": true, "sms": false, "order_updates": true, "promotions": true}',
  default_shipping_address_id UUID,
  default_billing_address_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_session_id ON orders(session_id);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);

CREATE INDEX idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX idx_user_carts_session_id ON user_carts(session_id);

CREATE INDEX idx_guest_customers_email ON guest_customers(email);
CREATE INDEX idx_guest_customers_last_order_date ON guest_customers(last_order_date);
```

## Triggers

```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_carts_updated_at BEFORE UPDATE ON user_carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_customers_updated_at BEFORE UPDATE ON guest_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for orders (users can only see their own orders)
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (
        customer_email = current_setting('request.jwt.claims')::json->>'email'
        OR user_id::text = current_setting('request.jwt.claims')::json->>'sub'
    );

-- Policies for user_carts
CREATE POLICY "Users can manage their own carts" ON user_carts
    FOR ALL USING (
        user_id::text = current_setting('request.jwt.claims')::json->>'sub'
    );
```

## Data Retention Policies

```sql
-- Clean up expired sessions (older than 30 days)
DELETE FROM user_sessions 
WHERE last_activity < NOW() - INTERVAL '30 days';

-- Clean up old guest carts (older than 7 days)
DELETE FROM user_carts 
WHERE session_id IS NOT NULL 
AND updated_at < NOW() - INTERVAL '7 days';

-- Archive completed orders older than 2 years
-- (This would be a separate archive table)
```

## API Endpoints Summary

Based on this schema, the following API endpoints are implemented:

- `POST /api/orders/guest` - Create guest orders
- `GET /api/orders/user` - Get user order history
- `GET /api/orders/track/[orderNumber]` - Track order by number
- `POST /api/cart/save` - Save cart data
- `GET /api/cart/load` - Load cart data
- `PATCH /api/orders/[id]/status` - Update order status (admin)

This schema supports:
- ✅ Guest checkout without registration
- ✅ User session management
- ✅ Cart persistence across devices
- ✅ Order history tracking
- ✅ Order status management
- ✅ Guest customer data collection
- ✅ Future user registration system
- ✅ Analytics and reporting capabilities
