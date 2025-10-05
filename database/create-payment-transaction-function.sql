-- Create transaction function for payment processing
-- Run this in Supabase SQL editor

CREATE OR REPLACE FUNCTION public.process_payment_completion(p_order_id uuid, p_order_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  plan_record RECORD;
  tokens_to_add INTEGER;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Lock the order row to prevent concurrent processing
  SELECT * INTO order_record
  FROM payment_orders
  WHERE id = p_order_id
  FOR UPDATE;

  -- Check if already processed
  IF order_record.status = 'completed' THEN
    RAISE NOTICE 'Order already completed: %', p_order_code;
    RETURN;
  END IF;

  -- Update order status
  UPDATE payment_orders
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_order_id;

  -- Process based on order type
  IF order_record.tokens_to_add IS NOT NULL AND order_record.user_id IS NOT NULL AND order_record.plan_id IS NULL THEN
    -- Token purchase order
    INSERT INTO user_tokens (user_id, total_tokens, used_tokens, last_reset_date)
    VALUES (order_record.user_id, order_record.tokens_to_add, 0, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_tokens = user_tokens.total_tokens + order_record.tokens_to_add,
      updated_at = NOW();

  ELSIF order_record.plan_id IS NOT NULL AND order_record.user_id IS NOT NULL THEN
    -- Membership order
    SELECT * INTO plan_record
    FROM membership_plans
    WHERE id = order_record.plan_id;

    IF plan_record IS NULL THEN
      RAISE EXCEPTION 'Plan not found: %', order_record.plan_id;
    END IF;

    -- Calculate tokens to add
    tokens_to_add := CASE 
      WHEN order_record.billing_cycle = 'monthly' THEN plan_record.tokens_monthly
      ELSE plan_record.tokens_yearly
    END;

    -- Add tokens
    INSERT INTO user_tokens (user_id, total_tokens, used_tokens, last_reset_date)
    VALUES (order_record.user_id, tokens_to_add, 0, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_tokens = user_tokens.total_tokens + tokens_to_add,
      updated_at = NOW();

    -- Calculate membership end date
    end_date := CASE 
      WHEN order_record.billing_cycle = 'monthly' THEN NOW() + INTERVAL '1 month'
      ELSE NOW() + INTERVAL '1 year'
    END;

    -- Expire existing active memberships
    UPDATE user_memberships
    SET status = 'expired', updated_at = NOW()
    WHERE user_id = order_record.user_id
      AND status = 'active';

    -- Create new membership
    INSERT INTO user_memberships (
      user_id, plan_id, status, start_date, end_date, 
      billing_cycle, auto_renew
    ) VALUES (
      order_record.user_id, order_record.plan_id, 'active', 
      NOW(), end_date, order_record.billing_cycle, false
    );

  ELSE
    RAISE EXCEPTION 'Invalid order type for order: %', p_order_code;
  END IF;

  -- Log successful processing
  RAISE NOTICE 'Payment processed successfully for order: %', p_order_code;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback on error
    RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
END;
$$;
