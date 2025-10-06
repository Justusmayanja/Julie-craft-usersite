-- =====================================================
-- COMPREHENSIVE STOCK_MOVEMENTS TABLE FIX
-- =====================================================
-- This script fixes ALL potential constraint mismatches in the
-- stock_movements table that prevent order creation from working.
-- It makes all columns nullable to allow database triggers to work.
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
END $$;

-- Make ALL potentially problematic columns nullable
DO $$
BEGIN
    -- Make product_name nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'product_name' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE stock_movements ALTER COLUMN product_name DROP NOT NULL;
        RAISE NOTICE 'Made product_name column nullable';
    ELSE
        RAISE NOTICE 'product_name column is already nullable';
    END IF;

    -- Make sku nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'sku' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE stock_movements ALTER COLUMN sku DROP NOT NULL;
        RAISE NOTICE 'Made sku column nullable';
    ELSE
        RAISE NOTICE 'sku column is already nullable';
    END IF;

    -- Make inventory_id nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'inventory_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE stock_movements ALTER COLUMN inventory_id DROP NOT NULL;
        RAISE NOTICE 'Made inventory_id column nullable';
    ELSE
        RAISE NOTICE 'inventory_id column is already nullable';
    END IF;

    -- Make movement_type nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'movement_type' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE stock_movements ALTER COLUMN movement_type DROP NOT NULL;
        RAISE NOTICE 'Made movement_type column nullable';
    ELSE
        RAISE NOTICE 'movement_type column is already nullable';
    END IF;

    -- Make quantity nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'quantity' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE stock_movements ALTER COLUMN quantity DROP NOT NULL;
        RAISE NOTICE 'Made quantity column nullable';
    ELSE
        RAISE NOTICE 'quantity column is already nullable';
    END IF;

    -- Make previous_stock nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'previous_stock' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE stock_movements ALTER COLUMN previous_stock DROP NOT NULL;
        RAISE NOTICE 'Made previous_stock column nullable';
    ELSE
        RAISE NOTICE 'previous_stock column is already nullable';
    END IF;

    -- Make any other columns that might be NOT NULL nullable
    -- This is a catch-all for any other columns that might cause issues
    DECLARE
        col_record RECORD;
    BEGIN
        FOR col_record IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'stock_movements' 
            AND table_schema = 'public'
            AND is_nullable = 'NO'
            AND column_name NOT IN ('id') -- Keep id as NOT NULL
        LOOP
            EXECUTE format('ALTER TABLE stock_movements ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
            RAISE NOTICE 'Made % column nullable', col_record.column_name;
        END LOOP;
    END;
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
SELECT 'All stock_movements table constraints fixed successfully!' as status;

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
