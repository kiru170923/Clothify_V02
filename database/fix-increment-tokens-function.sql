-- Fix increment_user_tokens function to handle new users
-- Run this in Supabase SQL editor

CREATE OR REPLACE FUNCTION public.increment_user_tokens(p_user_id uuid, p_tokens int)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use UPSERT to handle both existing and new users
  INSERT INTO user_tokens (user_id, total_tokens, used_tokens, last_reset_date)
  VALUES (p_user_id, p_tokens, 0, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_tokens = user_tokens.total_tokens + p_tokens,
    updated_at = NOW();
END;
$$;
