-- =====================================================
-- FIX STOCK_MOVEMENTS TABLE ISSUE
-- =====================================================
-- This script fixes the stock_movements table to work with order creation:
-- 1. Adds missing columns that database triggers expect
-- 2. Makes product_name nullable to allow trigger inserts
-- Missing columns: product_id, reference_type, reference_id, notes, created_by
-- =====================================================

-- Add missing columns to existing stock_movements table
DO $$ 
BEGIN
    -- Add product_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN product_id UUID;
        RAISE NOTICE 'Added product_id column to stock_movements table';
    ELSE
        RAISE NOTICE 'product_id column already exists in stock_movements table';
    END IF;

    -- Add reference_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' AND column_name = 'reference_type'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN reference_type VARCHAR(50);
        RAISE NOTICE 'Added reference_type column to stock_movements table';
    ELSE
        RAISE NOTICE 'reference_type column already exists in stock_movements table';
    END IF;

    -- Add reference_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' AND column_name = 'reference_id'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN reference_id UUID;
        RAISE NOTICE 'Added reference_id column to stock_movements table';
    ELSE
        RAISE NOTICE 'reference_id column already exists in stock_movements table';
    END IF;

    -- Add notes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' AND column_name = 'notes'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to stock_movements table';
    ELSE
        RAISE NOTICE 'notes column already exists in stock_movements table';
    END IF;

    -- Add created_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN created_by UUID;
        RAISE NOTICE 'Added created_by column to stock_movements table';
    ELSE
        RAISE NOTICE 'created_by column already exists in stock_movements table';
    END IF;

    -- Make product_name nullable if it's currently NOT NULL
    -- This allows the trigger to work without requiring product_name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'product_name' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE stock_movements ALTER COLUMN product_name DROP NOT NULL;
        RAISE NOTICE 'Made product_name column nullable in stock_movements table';
    ELSE
        RAISE NOTICE 'product_name column is already nullable in stock_movements table';
    END IF;
END $$;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- Add foreign key constraint if products table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Only add constraint if it doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'stock_movements' 
            AND constraint_name = 'fk_stock_movements_product_id'
        ) THEN
            ALTER TABLE stock_movements 
            ADD CONSTRAINT fk_stock_movements_product_id 
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint for product_id';
        ELSE
            RAISE NOTICE 'Foreign key constraint for product_id already exists';
        END IF;
    END IF;
END $$;

-- Verify the fix
SELECT 'stock_movements table missing columns added successfully!' as status;

-- Show updated table structure
SELECT 
    'STOCK_MOVEMENTS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stock_movements' 
ORDER BY ordinal_position;
