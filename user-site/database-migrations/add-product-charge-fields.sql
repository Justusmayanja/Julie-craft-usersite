-- Migration: Add include_shipping and include_tax columns to products table
-- Date: 2025
-- Description: Adds fields to allow per-product shipping and tax charges
--              By default, product price is final (no additional charges)

-- Add include_shipping column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'include_shipping'
    ) THEN
        ALTER TABLE public.products
        ADD COLUMN include_shipping BOOLEAN DEFAULT false NOT NULL;
        
        COMMENT ON COLUMN public.products.include_shipping IS 
        'If true, shipping charges will be added to product price at checkout. Default: false (product price is final)';
    END IF;
END $$;

-- Add include_tax column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'include_tax'
    ) THEN
        ALTER TABLE public.products
        ADD COLUMN include_tax BOOLEAN DEFAULT false NOT NULL;
        
        COMMENT ON COLUMN public.products.include_tax IS 
        'If true, tax charges (18%) will be added to product price at checkout. Default: false (product price is final)';
    END IF;
END $$;

-- Optional: Create indexes for better query performance if needed
-- CREATE INDEX IF NOT EXISTS idx_products_include_shipping ON public.products(include_shipping);
-- CREATE INDEX IF NOT EXISTS idx_products_include_tax ON public.products(include_tax);

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products' 
AND column_name IN ('include_shipping', 'include_tax')
ORDER BY column_name;

