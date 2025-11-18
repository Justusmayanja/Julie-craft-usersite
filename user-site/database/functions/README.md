# Database Functions Setup Guide

## Overview

This directory contains PostgreSQL functions that implement atomic, industry-standard order creation logic.

## Installation

### Step 1: Deploy the Function to Supabase

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `create_order_atomic.sql`
4. Paste and execute the SQL in the SQL Editor
5. Verify the function was created successfully

### Step 2: Verify Function Creation

Run this query to verify:

```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_order_atomic';
```

You should see the function listed.

### Step 3: Test the Function (Optional)

You can test the function with a sample call:

```sql
SELECT create_order_atomic(
  'ORD-TEST-001',
  'test@example.com',
  'Test Customer',
  NULL, -- phone
  NULL, -- user_id
  NULL, -- customer_id
  TRUE, -- is_guest_order
  'cash',
  100.00, -- subtotal
  0, -- tax_amount
  10.00, -- shipping_amount
  0, -- discount_amount
  110.00, -- total_amount
  'UGX',
  '{"address": "123 Test St"}',
  '{"address": "123 Test St"}',
  NULL, -- notes
  '[{"product_id": "your-product-uuid", "product_name": "Test Product", "quantity": 1, "price": 100.00, "total_price": 100.00}]'::jsonb,
  NULL -- reservation_ids
);
```

## What This Function Does

The `create_order_atomic` function ensures **atomic order creation** by:

1. ✅ **Validates stock availability** BEFORE creating any records
2. ✅ **Locks product rows** to prevent race conditions
3. ✅ **Creates order** only if all validations pass
4. ✅ **Creates order items** atomically
5. ✅ **Deducts inventory** immediately
6. ✅ **Creates audit records** (stock movements, alerts, notes)
7. ✅ **Consumes reservations** if provided
8. ✅ **Rolls back everything** if any step fails

## Benefits

- **No overselling**: Stock is validated and locked before order creation
- **Data consistency**: All-or-nothing transaction ensures no orphaned records
- **Race condition protection**: Row-level locking prevents concurrent order issues
- **Server-side validation**: Stock checks happen in the database, not application code
- **Automatic rollback**: If anything fails, the entire operation is rolled back

## Error Handling

The function returns JSONB with the following structure:

### Success Response
```json
{
  "success": true,
  "order_id": "uuid",
  "order_number": "ORD-123",
  "message": "Order created successfully"
}
```

### Error Responses
```json
{
  "success": false,
  "error": "Error message",
  "error_code": "INSUFFICIENT_STOCK",
  "failed_products": ["Product A (available: 2, requested: 5)"]
}
```

Common error codes:
- `NO_ITEMS`: No order items provided
- `PRODUCT_NOT_FOUND`: Product doesn't exist
- `INSUFFICIENT_STOCK`: Not enough stock available
- `ORDER_CREATION_FAILED`: General failure

## API Integration

The function is automatically called by:
- `/api/orders` (main order creation)
- `/api/orders/guest` (guest order creation)

No changes needed to your API routes - they now use this function automatically.

## Troubleshooting

### Function Not Found
If you get "function does not exist" errors:
1. Verify the function was created in the `public` schema
2. Check that you have execute permissions
3. Try recreating the function

### Permission Errors
If you get permission errors:
```sql
GRANT EXECUTE ON FUNCTION create_order_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_atomic TO service_role;
```

### Testing Issues
- Make sure all required tables exist (orders, order_items, products, etc.)
- Verify product IDs are valid UUIDs
- Check that stock_quantity values are correct

## Maintenance

### Updating the Function

If you need to update the function:
1. Drop the old function: `DROP FUNCTION IF EXISTS create_order_atomic(...)`
2. Run the new SQL script
3. Verify it works with a test call

### Monitoring

Check function performance:
```sql
SELECT 
  schemaname,
  funcname,
  calls,
  total_time,
  mean_time
FROM pg_stat_user_functions
WHERE funcname = 'create_order_atomic';
```

## Support

For issues or questions:
1. Check the error message returned by the function
2. Review the logs in Supabase Dashboard
3. Verify all required tables and columns exist
4. Check the ORDER_CREATION_ANALYSIS.md for detailed information

