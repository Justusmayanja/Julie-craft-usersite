-- =====================================================
-- STOCK MOVEMENTS TABLE FOR INVENTORY TRACKING
-- =====================================================
-- This table tracks all inventory movements for better
-- inventory management and auditing capabilities.
-- =====================================================

-- Create stock_movements table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return', 'reservation', 'release')),
    quantity INTEGER NOT NULL, -- Positive for additions, negative for deductions
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_type VARCHAR(20) CHECK (reference_type IN ('order', 'purchase_order', 'adjustment', 'return', 'reservation')),
    reference_id UUID, -- ID of the order, purchase order, etc.
    notes TEXT,
    created_by VARCHAR(255), -- User who made the change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for stock movements
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_movements' AND policyname = 'Allow all operations for authenticated users on stock_movements') THEN
        CREATE POLICY "Allow all operations for authenticated users on stock_movements" ON stock_movements FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- Create a function to automatically create stock movements
CREATE OR REPLACE FUNCTION create_stock_movement(
    p_product_id UUID,
    p_movement_type VARCHAR(20),
    p_quantity INTEGER,
    p_reference_type VARCHAR(20) DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_previous_quantity INTEGER;
    v_new_quantity INTEGER;
    v_movement_id UUID;
BEGIN
    -- Get current stock quantity
    SELECT stock_quantity INTO v_previous_quantity
    FROM products
    WHERE id = p_product_id;
    
    -- Calculate new quantity
    v_new_quantity := v_previous_quantity + p_quantity;
    
    -- Ensure quantity doesn't go below 0
    IF v_new_quantity < 0 THEN
        v_new_quantity := 0;
        p_quantity := v_new_quantity - v_previous_quantity;
    END IF;
    
    -- Update product stock
    UPDATE products
    SET stock_quantity = v_new_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Create stock movement record
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        reference_type,
        reference_id,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_movement_type,
        p_quantity,
        v_previous_quantity,
        v_new_quantity,
        p_reference_type,
        p_reference_id,
        p_notes,
        p_created_by
    ) RETURNING id INTO v_movement_id;
    
    RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get current available stock (considering reservations)
CREATE OR REPLACE FUNCTION get_available_stock(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_stock INTEGER;
    v_reserved_quantity INTEGER;
BEGIN
    -- Get total stock
    SELECT stock_quantity INTO v_total_stock
    FROM products
    WHERE id = p_product_id AND status = 'active';
    
    -- Return 0 if product not found or inactive
    IF v_total_stock IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get reserved quantity
    SELECT COALESCE(SUM(reserved_quantity), 0) INTO v_reserved_quantity
    FROM order_item_reservations
    WHERE product_id = p_product_id AND status = 'active';
    
    -- Return available stock
    RETURN GREATEST(0, v_total_stock - v_reserved_quantity);
END;
$$ LANGUAGE plpgsql;

-- Create a view for product stock summary
CREATE OR REPLACE VIEW product_stock_summary AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock_quantity as total_stock,
    COALESCE(SUM(CASE WHEN oir.status = 'active' THEN oir.reserved_quantity ELSE 0 END), 0) as reserved_quantity,
    GREATEST(0, p.stock_quantity - COALESCE(SUM(CASE WHEN oir.status = 'active' THEN oir.reserved_quantity ELSE 0 END), 0)) as available_stock,
    p.status,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN order_item_reservations oir ON p.id = oir.product_id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.status, p.created_at, p.updated_at;

-- Grant permissions
GRANT SELECT ON product_stock_summary TO authenticated;
GRANT EXECUTE ON FUNCTION create_stock_movement TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_stock TO authenticated;

-- Completion message
SELECT 'Stock movements table and functions created successfully!' as status;
