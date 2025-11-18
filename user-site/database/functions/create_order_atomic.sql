-- =====================================================
-- ATOMIC ORDER CREATION FUNCTION
-- =====================================================
-- This function ensures order creation is atomic (all-or-nothing)
-- It handles: stock validation, inventory deduction, order creation, and order items
-- in a single database transaction to prevent data inconsistency

CREATE OR REPLACE FUNCTION create_order_atomic(
  -- Required parameters (no defaults) - must come first
  p_order_number VARCHAR,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_subtotal NUMERIC,
  p_total_amount NUMERIC,
  p_shipping_address TEXT,
  p_billing_address TEXT,
  p_order_items JSONB,
  
  -- Optional parameters (with defaults) - must come after required ones
  p_customer_phone VARCHAR DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_is_guest_order BOOLEAN DEFAULT FALSE,
  p_payment_method VARCHAR DEFAULT 'cash',
  p_tax_amount NUMERIC DEFAULT 0,
  p_shipping_amount NUMERIC DEFAULT 0,
  p_discount_amount NUMERIC DEFAULT 0,
  p_currency TEXT DEFAULT 'UGX',
  p_notes TEXT DEFAULT NULL,
  p_reservation_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC;
  v_total_price NUMERIC;
  v_current_stock INTEGER;
  v_reserved_stock INTEGER;
  v_available_stock INTEGER;
  v_new_stock INTEGER;
  v_product_name TEXT;
  v_product_sku TEXT;
  v_reorder_point INTEGER;
  v_order_item_id UUID;
  v_reservation_id UUID;
  v_stock_movement_id UUID;
  v_error_message TEXT;
  v_failed_products TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Validate required parameters
  IF p_order_items IS NULL OR jsonb_array_length(p_order_items) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No order items provided',
      'error_code', 'NO_ITEMS'
    );
  END IF;

  -- Validate all items have sufficient stock BEFORE creating order
  -- This prevents creating orders for unavailable items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Lock the product row to prevent race conditions
    SELECT 
      stock_quantity,
      COALESCE(reserved_stock, 0),
      name,
      sku,
      COALESCE(reorder_point, 10)
    INTO 
      v_current_stock,
      v_reserved_stock,
      v_product_name,
      v_product_sku,
      v_reorder_point
    FROM products
    WHERE id = v_product_id
    FOR UPDATE; -- Row-level lock prevents concurrent modifications
    
    -- Check if product exists
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Product %s not found', v_product_id),
        'error_code', 'PRODUCT_NOT_FOUND',
        'product_id', v_product_id
      );
    END IF;
    
    -- Calculate available stock (considering reservations)
    v_available_stock := v_current_stock - v_reserved_stock;
    
    -- Validate stock availability
    IF v_available_stock < v_quantity THEN
      v_failed_products := array_append(
        v_failed_products,
        format('%s (available: %s, requested: %s)', v_product_name, v_available_stock, v_quantity)
      );
    END IF;
  END LOOP;
  
  -- If any products have insufficient stock, fail early
  IF array_length(v_failed_products, 1) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient stock for one or more products',
      'error_code', 'INSUFFICIENT_STOCK',
      'failed_products', v_failed_products
    );
  END IF;
  
  -- All validations passed, create the order
  INSERT INTO orders (
    order_number,
    customer_email,
    customer_name,
    customer_phone,
    user_id,
    customer_id,
    is_guest_order,
    status,
    payment_status,
    payment_method,
    subtotal,
    tax_amount,
    shipping_amount,
    discount_amount,
    total_amount,
    currency,
    shipping_address,
    billing_address,
    notes,
    order_date,
    inventory_reserved,
    reserved_at
  ) VALUES (
    p_order_number,
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_user_id,
    p_customer_id,
    p_is_guest_order,
    'pending',
    'pending',
    p_payment_method,
    p_subtotal,
    p_tax_amount,
    p_shipping_amount,
    p_discount_amount,
    p_total_amount,
    p_currency,
    p_shipping_address,
    p_billing_address,
    p_notes,
    NOW(),
    TRUE, -- Mark as reserved since we're about to deduct
    NOW()
  )
  RETURNING id INTO v_order_id;
  
  -- Create order items and deduct inventory atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_price := (v_item->>'price')::NUMERIC;
    v_total_price := COALESCE((v_item->>'total_price')::NUMERIC, v_price * v_quantity);
    v_product_name := COALESCE(v_item->>'product_name', 'Unknown Product');
    v_product_sku := COALESCE(v_item->>'product_sku', '');
    
    -- Get current stock with lock (already locked above, but get fresh values)
    SELECT 
      stock_quantity,
      COALESCE(reserved_stock, 0),
      COALESCE(reorder_point, 10)
    INTO 
      v_current_stock,
      v_reserved_stock,
      v_reorder_point
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;
    
    -- Calculate new stock
    v_new_stock := GREATEST(0, v_current_stock - v_quantity);
    
    -- Create order item
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_sku,
      quantity,
      price,
      total_price,
      product_image,
      created_at
    ) VALUES (
      v_order_id,
      v_product_id,
      v_product_name,
      v_product_sku,
      v_quantity,
      v_price,
      v_total_price,
      v_item->>'product_image',
      NOW()
    )
    RETURNING id INTO v_order_item_id;
    
    -- Deduct inventory atomically
    UPDATE products
    SET 
      stock_quantity = v_new_stock,
      updated_at = NOW(),
      last_sold_at = NOW()
    WHERE id = v_product_id;
    
    -- Create stock movement record
    BEGIN
      INSERT INTO stock_movements (
        product_id,
        product_name,
        sku,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reference_type,
        reference_id,
        notes,
        created_at
      ) VALUES (
        v_product_id,
        v_product_name,
        v_product_sku,
        'out',
        v_quantity,
        v_current_stock,
        v_new_stock,
        'order',
        v_order_id,
        format('Order %s - %s units sold', p_order_number, v_quantity),
        NOW()
      )
      RETURNING id INTO v_stock_movement_id;
    EXCEPTION WHEN OTHERS THEN
      -- Stock movements table might not exist or have issues, log but don't fail
      RAISE NOTICE 'Failed to create stock movement: %', SQLERRM;
    END;
    
    -- Check if product is at or below reorder point
    IF v_new_stock <= v_reorder_point THEN
      BEGIN
        INSERT INTO reorder_alerts (
          product_id,
          alert_type,
          current_stock,
          reorder_point,
          triggered_at
        ) VALUES (
          v_product_id,
          CASE WHEN v_new_stock = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
          v_new_stock,
          v_reorder_point,
          NOW()
        )
        ON CONFLICT DO NOTHING; -- Prevent duplicate alerts
      EXCEPTION WHEN OTHERS THEN
        -- Reorder alerts table might not exist, log but don't fail
        RAISE NOTICE 'Failed to create reorder alert: %', SQLERRM;
      END;
    END IF;
    
    -- Consume reservations if provided
    IF p_reservation_ids IS NOT NULL AND array_length(p_reservation_ids, 1) > 0 THEN
      FOREACH v_reservation_id IN ARRAY p_reservation_ids
      LOOP
        -- Mark reservation as fulfilled
        UPDATE order_item_reservations
        SET 
          status = 'fulfilled',
          released_at = NOW()
        WHERE id = v_reservation_id
          AND product_id = v_product_id
          AND status = 'active';
      END LOOP;
    END IF;
  END LOOP;
  
  -- Create internal order note
  BEGIN
    INSERT INTO order_notes (
      order_id,
      note_type,
      content,
      is_internal,
      created_by,
      created_at
    ) VALUES (
      v_order_id,
      'internal',
      format('New order received: %s from %s (%s) - Total: %s %s', 
        p_order_number, p_customer_name, p_customer_email, p_total_amount, p_currency),
      TRUE,
      'system',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create order note: %', SQLERRM;
  END;
  
  -- Create order task for admin
  BEGIN
    INSERT INTO order_tasks (
      order_id,
      task_type,
      title,
      description,
      status,
      priority,
      created_at
    ) VALUES (
      v_order_id,
      'payment_verification',
      'Verify Payment',
      format('Verify payment for order %s from %s', p_order_number, p_customer_name),
      'pending',
      'normal',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create order task: %', SQLERRM;
  END;
  
  -- Return success with order details
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order_number,
    'message', 'Order created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback is automatic in PostgreSQL functions
  -- Return error details
  GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Order creation failed',
    'error_code', 'ORDER_CREATION_FAILED',
    'error_message', v_error_message
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_order_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_atomic TO service_role;

-- Add comment
COMMENT ON FUNCTION create_order_atomic IS 
  'Atomically creates an order with inventory deduction. Validates stock, creates order, order items, and deducts inventory in a single transaction. Returns JSONB with success status and order details.';

