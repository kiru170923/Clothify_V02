-- Membership and Token System Schema
-- Run this in your Supabase SQL editor

-- Membership plans table
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- Price in VND
  price_yearly INTEGER NOT NULL, -- Price in VND (monthly * 12 * 0.8)
  tokens_monthly INTEGER NOT NULL, -- Number of tokens per month
  tokens_yearly INTEGER NOT NULL, -- Number of tokens per year
  features JSONB DEFAULT '[]', -- Array of features
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User memberships table
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES membership_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_tokens INTEGER DEFAULT 0, -- Total tokens available
  used_tokens INTEGER DEFAULT 0, -- Tokens used this period
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last token reset
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Token usage history table
CREATE TABLE IF NOT EXISTS token_usage_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tokens_used INTEGER DEFAULT 1, -- Usually 1 token per image
  usage_type TEXT DEFAULT 'image_generation' CHECK (usage_type IN ('image_generation', 'bonus', 'refund')),
  description TEXT, -- Description of usage
  related_image_id UUID REFERENCES images(id) ON DELETE SET NULL, -- Link to generated image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert membership plans
INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features) VALUES
('Standard', 'Gói cơ bản cho người dùng mới', 59000, 566400, 30, 360, '["30 ảnh/tháng", "Chất lượng HD", "Hỗ trợ email"]'),
('Medium', 'Gói phổ biến cho người dùng thường xuyên', 99000, 950400, 50, 600, '["50 ảnh/tháng", "Chất lượng HD+", "Hỗ trợ ưu tiên", "Lưu trữ 100 ảnh"]'),
('Premium', 'Gói cao cấp cho người dùng chuyên nghiệp', 159000, 1526400, 100, 1200, '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access"]');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_history_user_id ON token_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_history_created_at ON token_usage_history(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Membership plans are readable by all authenticated users
CREATE POLICY "Membership plans are viewable by authenticated users" ON membership_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only see their own membership and tokens
CREATE POLICY "Users can view own membership" ON user_memberships
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own tokens" ON user_tokens
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own token history" ON token_usage_history
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Only admins can insert/update memberships and tokens
CREATE POLICY "Only admins can manage memberships" ON user_memberships
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only admins can manage tokens" ON user_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only admins can manage token history" ON token_usage_history
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON membership_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at BEFORE UPDATE ON user_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user tokens when user is created
CREATE OR REPLACE FUNCTION initialize_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_tokens (user_id, total_tokens, used_tokens)
  VALUES (NEW.id, 5, 0); -- Give 5 free tokens to new users
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create tokens for new users
DROP TRIGGER IF EXISTS on_user_created_tokens ON users;
CREATE TRIGGER on_user_created_tokens
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_tokens();

-- Function to check and reset monthly tokens
CREATE OR REPLACE FUNCTION reset_monthly_tokens()
RETURNS void AS $$
BEGIN
  UPDATE user_tokens 
  SET 
    total_tokens = CASE 
      WHEN um.billing_cycle = 'monthly' THEN mp.tokens_monthly
      ELSE mp.tokens_yearly
    END,
    used_tokens = 0,
    last_reset_date = NOW()
  FROM user_memberships um
  JOIN membership_plans mp ON um.plan_id = mp.id
  WHERE user_tokens.user_id = um.user_id
    AND um.status = 'active'
    AND (user_tokens.last_reset_date < NOW() - INTERVAL '1 month' OR user_tokens.last_reset_date IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.membership_plans TO authenticated;
GRANT ALL ON public.user_memberships TO authenticated;
GRANT ALL ON public.user_tokens TO authenticated;
GRANT ALL ON public.token_usage_history TO authenticated;
