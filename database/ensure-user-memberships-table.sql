-- Ensure user_memberships table exists with correct structure
-- Run this in Supabase SQL Editor

-- Create user_memberships table if not exists
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan_id ON user_memberships(plan_id);

-- Enable RLS
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON user_memberships;
CREATE POLICY "Users can view their own memberships" 
ON user_memberships FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own memberships" ON user_memberships;
CREATE POLICY "Users can insert their own memberships" 
ON user_memberships FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own memberships" ON user_memberships;
CREATE POLICY "Users can update their own memberships" 
ON user_memberships FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Service role can do everything (for payment processing)
DROP POLICY IF EXISTS "Service role full access" ON user_memberships;
CREATE POLICY "Service role full access" 
ON user_memberships FOR ALL 
TO service_role 
USING (true);

-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
ORDER BY ordinal_position;
