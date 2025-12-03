-- Add idempotency_key column to orders table
-- This allows preventing duplicate orders from the same request

-- Check if column already exists before adding
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN idempotency_key VARCHAR(255) UNIQUE;
    
    -- Add index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
    
    -- Add comment
    COMMENT ON COLUMN orders.idempotency_key IS 'Unique key to prevent duplicate orders from the same request. Used for idempotency.';
  END IF;
END $$;

