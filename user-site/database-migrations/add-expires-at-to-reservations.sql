-- Migration: Add expires_at, user_id, and session_id columns to order_item_reservations table
-- This migration adds support for reservation expiration and user/session tracking

-- Add expires_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_item_reservations' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.order_item_reservations
    ADD COLUMN expires_at timestamp with time zone;
    
    COMMENT ON COLUMN public.order_item_reservations.expires_at IS 'Timestamp when the reservation expires. NULL means no expiration.';
  END IF;
END $$;

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_item_reservations' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.order_item_reservations
    ADD COLUMN user_id uuid;
    
    COMMENT ON COLUMN public.order_item_reservations.user_id IS 'User ID who created the reservation (if authenticated)';
  END IF;
END $$;

-- Add session_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_item_reservations' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.order_item_reservations
    ADD COLUMN session_id text;
    
    COMMENT ON COLUMN public.order_item_reservations.session_id IS 'Session ID for anonymous users';
  END IF;
END $$;

-- Create index on expires_at for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_order_item_reservations_expires_at 
ON public.order_item_reservations(expires_at) 
WHERE expires_at IS NOT NULL;

-- Create index on user_id for efficient user reservation queries
CREATE INDEX IF NOT EXISTS idx_order_item_reservations_user_id 
ON public.order_item_reservations(user_id) 
WHERE user_id IS NOT NULL;

-- Create index on session_id for efficient session reservation queries
CREATE INDEX IF NOT EXISTS idx_order_item_reservations_session_id 
ON public.order_item_reservations(session_id) 
WHERE session_id IS NOT NULL;

-- Create composite index for active reservations
-- Note: We can't use NOW() in index predicate (not immutable), so we index all active reservations
-- The application will filter by expiration time when querying
CREATE INDEX IF NOT EXISTS idx_order_item_reservations_active_non_expired 
ON public.order_item_reservations(product_id, status, expires_at) 
WHERE status = 'active';

