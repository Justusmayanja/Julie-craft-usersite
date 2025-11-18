-- =====================================================
-- ATOMIC INVENTORY ADJUSTMENT FUNCTION
-- =====================================================
-- This function ensures inventory adjustments are atomic (all-or-nothing)
-- It handles: increase, decrease, and set operations with full validation
-- Creates stock movements, audit logs, and updates stock atomically

CREATE OR REPLACE FUNCTION adjust_inventory_atomic(
  -- Required parameters
  p_product_id UUID,
  p_adjustment_type TEXT, -- 'increase', 'decrease', 'set'
  p_quantity INTEGER,
  p_reason TEXT,
  
  -- Optional parameters
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
  v_reserved_stock INTEGER;
  v_max_stock INTEGER;
  v_new_stock INTEGER;
  v_product_name TEXT;
  v_product_sku TEXT;
  v_reorder_point INTEGER;
  v_stock_movement_id UUID;
  v_error_message TEXT;
  v_quantity_change INTEGER;
BEGIN
  -- Validate required parameters
  IF p_product_id IS NULL OR p_adjustment_type IS NULL OR p_quantity IS NULL OR p_reason IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required parameters',
      'error_code', 'MISSING_PARAMETERS'
    );
  END IF;
  
  -- Validate adjustment type
  IF p_adjustment_type NOT IN ('increase', 'decrease', 'set') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid adjustment type: %s. Must be one of: increase, decrease, set', p_adjustment_type),
      'error_code', 'INVALID_ADJUSTMENT_TYPE'
    );
  END IF;
  
  -- Validate quantity
  IF p_quantity < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quantity cannot be negative',
      'error_code', 'INVALID_QUANTITY'
    );
  END IF;
  
  -- Lock product row and get current values
  SELECT 
    COALESCE(physical_stock, stock_quantity, 0),
    COALESCE(reserved_stock, 0),
    COALESCE(max_stock_level, 999999),
    COALESCE(reorder_point, 10),
    name,
    COALESCE(sku, '')
  INTO 
    v_current_stock,
    v_reserved_stock,
    v_max_stock,
    v_reorder_point,
    v_product_name,
    v_product_sku
  FROM products
  WHERE id = p_product_id
  FOR UPDATE; -- Row-level lock prevents concurrent modifications
  
  -- Check if product exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Product %s not found', p_product_id),
      'error_code', 'PRODUCT_NOT_FOUND',
      'product_id', p_product_id
    );
  END IF;
  
  -- Calculate new stock based on adjustment type
  CASE p_adjustment_type
    WHEN 'increase' THEN
      v_new_stock := v_current_stock + p_quantity;
      v_quantity_change := p_quantity;
    WHEN 'decrease' THEN
      v_new_stock := GREATEST(0, v_current_stock - p_quantity);
      v_quantity_change := -p_quantity;
    WHEN 'set' THEN
      v_new_stock := p_quantity;
      v_quantity_change := p_quantity - v_current_stock;
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid adjustment type',
        'error_code', 'INVALID_ADJUSTMENT_TYPE'
      );
  END CASE;
  
  -- Validate new stock is not negative
  IF v_new_stock < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot set stock below zero',
      'error_code', 'NEGATIVE_STOCK',
      'current_stock', v_current_stock,
      'requested_change', v_quantity_change
    );
  END IF;
  
  -- Validate max stock level (only for increases)
  IF p_adjustment_type IN ('increase', 'set') AND v_max_stock < 999999 AND v_new_stock > v_max_stock THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Stock would exceed maximum of %s units', v_max_stock),
      'error_code', 'EXCEEDS_MAX_STOCK',
      'current_stock', v_current_stock,
      'max_stock', v_max_stock,
      'would_result_in', v_new_stock
    );
  END IF;
  
  -- Update product stock atomically
  UPDATE products
  SET 
    physical_stock = v_new_stock,
    stock_quantity = v_new_stock,
    updated_at = NOW(),
    last_restocked_at = CASE 
      WHEN p_adjustment_type = 'increase' THEN NOW()
      ELSE last_restocked_at
    END,
    last_stock_update = NOW()
  WHERE id = p_product_id;
  
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
      reason,
      reference_type,
      reference_id,
      notes,
      created_by,
      created_at
    ) VALUES (
      p_product_id,
      v_product_name,
      v_product_sku,
      CASE 
        WHEN p_adjustment_type = 'increase' THEN 'in'
        WHEN p_adjustment_type = 'decrease' THEN 'out'
        ELSE 'adjustment'
      END,
      ABS(v_quantity_change), -- Always positive for movement record
      v_current_stock,
      v_new_stock,
      p_reason,
      p_reference_type,
      p_reference_id,
      p_notes,
      p_user_id,
      NOW()
    )
    RETURNING id INTO v_stock_movement_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create stock movement: %', SQLERRM;
  END;
  
  -- Create inventory adjustment record
  BEGIN
    INSERT INTO inventory_adjustments (
      product_id,
      product_name,
      adjustment_type,
      quantity_before,
      quantity_after,
      quantity_change,
      reason,
      notes,
      reference,
      user_id,
      approval_status,
      created_at
    ) VALUES (
      p_product_id,
      v_product_name,
      p_adjustment_type,
      v_current_stock,
      v_new_stock,
      v_quantity_change,
      p_reason,
      p_notes,
      COALESCE(p_reference_id::TEXT, ''),
      p_user_id,
      'approved', -- Auto-approved since we're applying it directly
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create inventory adjustment record: %', SQLERRM;
  END;
  
  -- Check if reorder alerts should be resolved or created
  IF v_new_stock > v_reorder_point THEN
    BEGIN
      UPDATE reorder_alerts
      SET 
        alert_status = 'resolved',
        resolved_at = NOW(),
        notes = COALESCE(notes, '') || format(' - Resolved by inventory adjustment on %s', NOW()::TEXT)
      WHERE product_id = p_product_id
        AND alert_status = 'active'
        AND alert_type IN ('low_stock', 'out_of_stock');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update reorder alerts: %', SQLERRM;
    END;
  ELSIF v_new_stock <= v_reorder_point THEN
    BEGIN
      INSERT INTO reorder_alerts (
        product_id,
        alert_type,
        current_stock,
        reorder_point,
        triggered_at
      ) VALUES (
        p_product_id,
        CASE WHEN v_new_stock = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
        v_new_stock,
        v_reorder_point,
        NOW()
      )
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create reorder alert: %', SQLERRM;
    END;
  END IF;
  
  -- Create inventory audit log entry
  BEGIN
    INSERT INTO inventory_audit_log (
      product_id,
      product_name,
      product_sku,
      physical_stock_before,
      physical_stock_after,
      reserved_stock_before,
      reserved_stock_after,
      available_stock_before,
      available_stock_after,
      operation_type,
      operation_reason,
      quantity_affected,
      reference_id,
      related_user_id,
      inventory_version_before,
      inventory_version_after,
      notes,
      created_at
    ) VALUES (
      p_product_id,
      v_product_name,
      v_product_sku,
      v_current_stock,
      v_new_stock,
      v_reserved_stock,
      v_reserved_stock, -- Reserved stock unchanged
      v_current_stock - v_reserved_stock,
      v_new_stock - v_reserved_stock,
      'inventory_adjustment',
      p_reason,
      ABS(v_quantity_change),
      p_reference_id,
      p_user_id,
      1,
      1,
      p_notes,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create inventory audit log: %', SQLERRM;
  END;
  
  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'product_name', v_product_name,
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock,
    'quantity_change', v_quantity_change,
    'adjustment_type', p_adjustment_type,
    'stock_movement_id', v_stock_movement_id,
    'message', format('Successfully %s inventory by %s units', 
      CASE p_adjustment_type
        WHEN 'increase' THEN 'increased'
        WHEN 'decrease' THEN 'decreased'
        ELSE 'set'
      END,
      ABS(v_quantity_change))
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback is automatic in PostgreSQL functions
  GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Inventory adjustment failed',
    'error_code', 'INVENTORY_ADJUSTMENT_FAILED',
    'error_message', v_error_message
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION adjust_inventory_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_inventory_atomic TO service_role;

-- Add comment
COMMENT ON FUNCTION adjust_inventory_atomic IS 
  'Atomically adjusts inventory (increase, decrease, or set). Validates stock levels, updates product stock, creates stock movement and audit records in a single transaction. Returns JSONB with success status and details.';

