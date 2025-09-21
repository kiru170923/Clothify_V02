-- Simple script to create membership_plans table
-- Run this in Supabase SQL Editor

-- Drop table if exists (be careful!)
DROP TABLE IF EXISTS membership_plans CASCADE;

-- Create membership plans table
CREATE TABLE membership_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  tokens_monthly INTEGER NOT NULL,
  tokens_yearly INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert membership plans
INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features) VALUES
('Standard', 'Gói cơ bản cho người dùng mới', 59000, 566400, 30, 360, '["30 ảnh/tháng", "Chất lượng HD", "Hỗ trợ email"]'),
('Medium', 'Gói phổ biến cho người dùng thường xuyên', 99000, 950400, 50, 600, '["50 ảnh/tháng", "Chất lượng HD+", "Hỗ trợ ưu tiên", "Lưu trữ 100 ảnh"]'),
('Premium', 'Gói cao cấp cho người dùng chuyên nghiệp', 159000, 1526400, 100, 1200, '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access"]');

-- Enable RLS
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Membership plans are viewable by authenticated users" ON membership_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.membership_plans TO authenticated;
