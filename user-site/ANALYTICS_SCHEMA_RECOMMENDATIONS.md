# Analytics Schema Recommendations

## Overview

This document provides recommendations for optimizing your Supabase database schema to support real-time analytics visualizations.

## Current Schema Status

The analytics system works with your existing tables:
- ✅ `orders` - Contains order data
- ✅ `order_items` - Contains order line items
- ✅ `products` - Contains product data
- ✅ `categories` - Contains category data (optional)

## Recommended Indexes

For optimal query performance, add these indexes:

```sql
-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON products(category, stock_quantity);
```

## Recommended Columns

### Orders Table

Ensure these columns exist:
- `id` (uuid, primary key)
- `order_number` (varchar, unique)
- `total_amount` (numeric/decimal)
- `status` (text: 'pending', 'processing', 'shipped', 'delivered', 'cancelled')
- `payment_status` (text: 'pending', 'paid', 'failed', 'refunded')
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `user_id` (uuid, foreign key to profiles)
- `customer_email` (varchar)

### Order Items Table

Ensure these columns exist:
- `id` (uuid, primary key)
- `order_id` (uuid, foreign key to orders)
- `product_id` (uuid, foreign key to products)
- `product_name` (text)
- `quantity` (integer)
- `price` (numeric/decimal) - total price for the line item
- `unit_price` (numeric/decimal) - price per unit
- `total_price` (numeric/decimal) - calculated total
- `created_at` (timestamp with time zone)

### Products Table

Ensure these columns exist:
- `id` (uuid, primary key)
- `name` (text)
- `category` (text) - **Important for Revenue by Category chart**
- `stock_quantity` (integer) - **Important for Inventory chart**
- `price` (numeric/decimal)
- `created_at` (timestamp with time zone)

### Categories Table (Optional but Recommended)

If you have a separate categories table:
- `id` (uuid, primary key)
- `name` (text)
- `slug` (text, unique)

## Missing Field Computations

The analytics system automatically computes missing fields:

1. **Revenue Calculation**: If `total_price` is missing, uses `price * quantity`
2. **Category Mapping**: If product category is missing, uses 'Uncategorized'
3. **Status Normalization**: Normalizes status values (e.g., 'completed' = 'delivered')

## Performance Optimizations

### Materialized Views (Optional)

For very large datasets, consider creating materialized views:

```sql
-- Daily sales summary
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status IN ('delivered', 'completed')
GROUP BY DATE(created_at);

-- Refresh schedule (run daily)
CREATE UNIQUE INDEX ON daily_sales_summary(sale_date);
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
```

### Realtime Subscriptions

The system uses Supabase Realtime subscriptions. Ensure:
1. Realtime is enabled in your Supabase project
2. Row Level Security (RLS) policies allow read access for analytics
3. Tables have proper triggers for `updated_at` timestamps

## RLS Policies for Analytics

If using Row Level Security, ensure admins can read all data:

```sql
-- Allow admins to read all orders
CREATE POLICY "Admins can read all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Similar policies for order_items, products, categories
```

## Data Retention

Consider implementing:
1. **Archive old orders**: Move orders older than 2 years to archive table
2. **Aggregate historical data**: Store daily/weekly aggregates
3. **Clean up cancelled orders**: Optionally remove or flag cancelled orders after 90 days

## Monitoring

Monitor these metrics:
- Query performance on date ranges
- Realtime subscription latency
- Index usage statistics
- Table size growth

## Next Steps

1. Run the index creation SQL above
2. Verify all required columns exist
3. Test realtime subscriptions
4. Monitor query performance
5. Consider materialized views for large datasets

