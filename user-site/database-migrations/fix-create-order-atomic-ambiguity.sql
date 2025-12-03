-- Fix create_order_atomic function ambiguity
-- This migration drops all existing versions of the function and recreates it with the new signature

-- Drop all existing versions of the function (handles multiple overloads)
DROP FUNCTION IF EXISTS create_order_atomic CASCADE;

-- Note: The function will be recreated by running create_order_atomic.sql
-- This migration just ensures old versions are removed first

