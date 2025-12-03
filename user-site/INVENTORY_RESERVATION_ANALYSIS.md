# Inventory Reservation & Deduction Analysis

## Executive Summary

The system has a **two-phase reservation system** that is **partially implemented** but has a **critical bug** preventing reservations from being consumed during order creation. The atomic order creation function is well-designed but reservations are not being passed from the frontend to the backend.

## Current Implementation Flow

### Phase 1: Reservation (Cart Context)
1. ✅ User adds items to cart
2. ✅ Before checkout, `reserveItems()` is called
3. ✅ Creates reservations in `order_item_reservations` table
4. ✅ Reservation IDs stored in cart state (`item.reservationId`)
5. ✅ Stock availability checked considering existing reservations

### Phase 2: Order Creation (Backend)
1. ✅ Atomic function `create_order_atomic` exists
2. ✅ Function accepts `p_reservation_ids` parameter
3. ✅ Function has logic to consume reservations (lines 284-297)
4. ❌ **BUG**: Reservation IDs are NOT passed from frontend to backend
5. ✅ Inventory is deducted directly from `stock_quantity`
6. ✅ Reservations remain as "active" and are never consumed

## Critical Issues Found

### 🔴 **Issue #1: Reservations Not Passed to Order API**

**Location**: `user-site/contexts/cart-context.tsx:608-619`

**Problem**: 
```typescript
const createOrderData = {
  customer_email: orderData.customer_email,
  customer_name: orderData.customer_name,
  // ... other fields ...
  // ❌ reservation_ids is MISSING!
}
```

**Impact**:
- Reservations are created but never consumed
- Reservations accumulate in database as "active"
- Wasted database operations
- Potential inventory discrepancies over time

**Fix Required**:
```typescript
const reservationIds = state.items
  .filter(item => item.reservationId)
  .map(item => item.reservationId!)

const createOrderData = {
  // ... existing fields ...
  reservation_ids: reservationIds.length > 0 ? reservationIds : undefined
}
```

### 🔴 **Issue #2: Reservation Consumption Logic Has Flaw**

**Location**: `user-site/database/functions/create_order_atomic.sql:284-297`

**Problem**: 
The reservation consumption loop is inside the order items loop, but it tries to match reservations by `product_id`. However, if multiple reservations exist for the same product, it may consume the wrong reservation or fail to consume any.

**Current Logic**:
```sql
FOREACH v_reservation_id IN ARRAY p_reservation_ids
LOOP
  UPDATE order_item_reservations
  SET status = 'fulfilled', released_at = NOW()
  WHERE id = v_reservation_id
    AND product_id = v_product_id  -- ⚠️ This matches by product_id
    AND status = 'active';
END LOOP;
```

**Issues**:
1. If reservation IDs don't match product IDs in the loop, reservations won't be consumed
2. No validation that reservation quantity matches order item quantity
3. No error handling if reservation consumption fails

**Better Approach**:
```sql
-- Consume reservations BEFORE processing order items
-- Match reservations to order items by product_id and quantity
FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
LOOP
  v_product_id := (v_item->>'product_id')::UUID;
  v_quantity := (v_item->>'quantity')::INTEGER;
  
  -- Find and consume matching reservation
  UPDATE order_item_reservations
  SET 
    status = 'fulfilled',
    released_at = NOW(),
    order_id = v_order_id  -- Link to order
  WHERE id = ANY(p_reservation_ids)
    AND product_id = v_product_id
    AND reserved_quantity = v_quantity
    AND status = 'active'
  LIMIT 1;  -- Consume one reservation per order item
END LOOP;
```

### ⚠️ **Issue #3: Double Stock Calculation**

**Location**: `user-site/database/functions/create_order_atomic.sql:98-99`

**Problem**: 
Available stock is calculated as `stock_quantity - reserved_stock`, but `reserved_stock` is a computed field that may not include all active reservations, or may include reservations that should be consumed.

**Current Logic**:
```sql
v_available_stock := v_current_stock - v_reserved_stock;
```

**Issue**: 
- If reservations are being consumed, they should be excluded from the reserved_stock calculation
- The `reserved_stock` field might be a database column that's not updated in real-time

**Better Approach**:
```sql
-- Calculate reserved stock dynamically from active reservations
SELECT COALESCE(SUM(reserved_quantity), 0) INTO v_reserved_stock
FROM order_item_reservations
WHERE product_id = v_product_id
  AND status = 'active'
  AND (expires_at IS NULL OR expires_at > NOW());

v_available_stock := v_current_stock - v_reserved_stock;
```

### ⚠️ **Issue #4: No Reservation Expiration Handling**

**Location**: `user-site/app/api/inventory/reserve/route.ts`

**Problem**: 
Reservations are created without expiration timestamps, meaning they can remain "active" indefinitely if not consumed.

**Current Implementation**:
```typescript
.insert({
  product_id: productId,
  reserved_quantity: quantity,
  status: 'active',
  // ❌ No expires_at field
})
```

**Impact**:
- Reservations can block inventory indefinitely
- No automatic cleanup of stale reservations
- Manual intervention required to release old reservations

**Recommendation**:
```typescript
.insert({
  product_id: productId,
  reserved_quantity: quantity,
  status: 'active',
  expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
})
```

## What's Working Well ✅

1. **Atomic Transaction**: The `create_order_atomic` function uses PostgreSQL transactions, ensuring all-or-nothing order creation
2. **Row-Level Locking**: Uses `FOR UPDATE` to prevent race conditions
3. **Stock Validation**: Validates stock availability before creating order
4. **Error Handling**: Proper error handling and rollback on failure
5. **Stock Movements**: Creates audit trail via `stock_movements` table
6. **Reorder Alerts**: Automatically creates alerts when stock is low

## Best Practices Assessment

### ✅ Following Best Practices

1. **Atomic Operations**: Order creation is atomic (all-or-nothing)
2. **Pessimistic Locking**: Uses `FOR UPDATE` for row-level locks
3. **Stock Validation Before Deduction**: Validates stock before creating order
4. **Audit Trail**: Creates stock movement records
5. **Error Handling**: Proper exception handling with rollback

### ❌ Not Following Best Practices

1. **Reservation System**: Reservations created but not consumed
2. **Reservation Expiration**: No automatic expiration of stale reservations
3. **Reservation Matching**: Reservation consumption logic is flawed
4. **Double Counting**: Potential for double-counting reserved stock
5. **Idempotency**: No idempotency keys for order creation (prevents duplicate orders)

## Recommendations

### Priority 1: Fix Critical Bugs

1. **Pass Reservation IDs to Order API**
   - Update `cart-context.tsx` to include `reservation_ids` in order data
   - Ensure reservation IDs are extracted from cart state

2. **Fix Reservation Consumption Logic**
   - Match reservations to order items correctly
   - Validate reservation quantities match order quantities
   - Add error handling for reservation consumption failures

3. **Add Reservation Expiration**
   - Set expiration timestamp when creating reservations (15-30 minutes)
   - Create background job to clean up expired reservations

### Priority 2: Improve Robustness

4. **Dynamic Reserved Stock Calculation**
   - Calculate reserved stock from active reservations, not a cached field
   - Exclude reservations being consumed in the same transaction

5. **Add Idempotency**
   - Use idempotency keys for order creation
   - Prevent duplicate orders from same request

6. **Reservation Cleanup**
   - Automatic cleanup of expired reservations
   - Periodic job to release stale reservations

### Priority 3: Enhancements

7. **Reservation Validation**
   - Validate reservation belongs to current user/session
   - Prevent reservation hijacking

8. **Better Error Messages**
   - Provide specific error messages when reservations fail
   - Log reservation consumption for debugging

## Code Changes Required

### 1. Fix cart-context.tsx

```typescript
// In placeOrder function, after reserveItems()
const reservationIds = state.items
  .filter(item => item.reservationId)
  .map(item => item.reservationId!)

const createOrderData = {
  customer_email: orderData.customer_email,
  customer_name: orderData.customer_name,
  customer_phone: orderData.customer_phone,
  shipping_address: orderData.shipping_address,
  billing_address: orderData.billing_address || orderData.shipping_address,
  items: orderItems,
  ...totals,
  currency: 'UGX',
  notes: orderData.notes,
  payment_method: orderData.payment_method,
  reservation_ids: reservationIds.length > 0 ? reservationIds : undefined  // ✅ ADD THIS
}
```

### 2. Improve create_order_atomic.sql

```sql
-- Before order creation loop, consume reservations
IF p_reservation_ids IS NOT NULL AND array_length(p_reservation_ids, 1) > 0 THEN
  -- Mark all provided reservations as fulfilled
  UPDATE order_item_reservations
  SET 
    status = 'fulfilled',
    released_at = NOW()
  WHERE id = ANY(p_reservation_ids)
    AND status = 'active';
END IF;

-- Then in order items loop, calculate available stock excluding fulfilled reservations
-- (reservations are already consumed above)
```

### 3. Add Reservation Expiration

```typescript
// In app/api/inventory/reserve/route.ts
const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

await supabaseAdmin
  .from('order_item_reservations')
  .insert({
    product_id: productId,
    reserved_quantity: quantity,
    status: 'active',
    expires_at: expiresAt,  // ✅ ADD THIS
    notes: `Reserved for ${reservation_type} - ${user_id ? 'user' : 'session'}: ${user_id || session_id}`,
    created_at: new Date().toISOString()
  })
```

## Testing Checklist

- [ ] Reservations are created when items are added to cart
- [ ] Reservation IDs are passed to order creation API
- [ ] Reservations are consumed when order is created
- [ ] Reservations expire after 15 minutes
- [ ] Expired reservations don't block inventory
- [ ] Multiple orders for same product handle reservations correctly
- [ ] Order creation fails gracefully if reservation is missing
- [ ] Stock is correctly calculated considering reservations
- [ ] No double-counting of reserved stock
- [ ] Race conditions are prevented with row-level locks

## Conclusion

The reservation system is **well-architected** but has a **critical implementation bug** preventing reservations from being consumed. The atomic order creation function is excellent, but needs the reservation IDs to be passed from the frontend. Once fixed, the system will follow industry best practices for inventory management.

**Overall Grade**: B+ (Good architecture, needs bug fixes)

