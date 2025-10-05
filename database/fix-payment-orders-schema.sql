-- Fix payment_orders schema to support token orders
-- Run this in Supabase SQL editor

-- Make plan_id and billing_cycle nullable to support token orders
ALTER TABLE payment_orders 
  ALTER COLUMN plan_id DROP NOT NULL,
  ALTER COLUMN billing_cycle DROP NOT NULL;

-- Add tokens_to_add column if not exists
ALTER TABLE payment_orders 
  ADD COLUMN IF NOT EXISTS tokens_to_add INTEGER;

-- Update constraints to allow either membership or token orders
ALTER TABLE payment_orders 
  DROP CONSTRAINT IF EXISTS payment_orders_billing_cycle_check;

ALTER TABLE payment_orders 
  ADD CONSTRAINT payment_orders_billing_cycle_check 
  CHECK (billing_cycle IN ('monthly', 'yearly') OR billing_cycle IS NULL);

-- Add constraint to ensure order has either plan_id or tokens_to_add
ALTER TABLE payment_orders 
  ADD CONSTRAINT payment_orders_type_check 
  CHECK (
    (plan_id IS NOT NULL AND billing_cycle IS NOT NULL AND tokens_to_add IS NULL) OR
    (plan_id IS NULL AND billing_cycle IS NULL AND tokens_to_add IS NOT NULL)
  );

-- Create index for tokens_to_add column
CREATE INDEX IF NOT EXISTS idx_payment_orders_tokens_to_add ON payment_orders(tokens_to_add) WHERE tokens_to_add IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN payment_orders.tokens_to_add IS 'Number of tokens to add for token purchase orders (NULL for membership orders)';
COMMENT ON CONSTRAINT payment_orders_type_check ON payment_orders IS 'Ensures order is either membership (plan_id + billing_cycle) or token purchase (tokens_to_add)';
