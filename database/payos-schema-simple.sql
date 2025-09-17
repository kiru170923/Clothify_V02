-- PayOS Payment Schema - Simplified Version
-- Chạy schema này trước khi chạy payos-schema.sql

-- Tạo bảng membership_plans nếu chưa có
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
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

-- Insert sample membership plans
INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features) VALUES
('Standard', 'Gói cơ bản cho người dùng mới', 59000, 566400, 30, 360, '["30 ảnh/tháng", "Chất lượng HD", "Hỗ trợ email"]'),
('Medium', 'Gói phổ biến cho người dùng thường xuyên', 99000, 950400, 50, 600, '["50 ảnh/tháng", "Chất lượng HD+", "Hỗ trợ ưu tiên", "Lưu trữ 100 ảnh"]'),
('Premium', 'Gói cao cấp cho người dùng chuyên nghiệp', 159000, 1526400, 100, 1200, '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access"]')
ON CONFLICT DO NOTHING;

-- Bảng payment_orders
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'payos',
  payment_url TEXT,
  order_info TEXT,
  external_order_code VARCHAR(255), -- PayOS order code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng payment_history
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_order_id UUID NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  billing_cycle VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  external_order_code VARCHAR(255),
  transaction_id VARCHAR(255), -- PayOS transaction ID
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_external_code ON payment_orders(external_order_code);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_order_id ON payment_history(payment_order_id);

-- RLS Policies
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Membership plans are viewable by all authenticated users
CREATE POLICY "Membership plans are viewable by authenticated users" ON membership_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can only see their own payment orders
CREATE POLICY "Users can view own payment orders" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only see their own payment history
CREATE POLICY "Users can view own payment history" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can manage all data
CREATE POLICY "Service role can manage membership plans" ON membership_plans
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payment orders" ON payment_orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payment history" ON payment_history
  FOR ALL USING (auth.role() = 'service_role');

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_membership_plans_updated_at
  BEFORE UPDATE ON membership_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Get user payment history
CREATE OR REPLACE FUNCTION get_user_payment_history(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  plan_name VARCHAR(255),
  billing_cycle VARCHAR(20),
  amount INTEGER,
  status VARCHAR(20),
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.id,
    mp.name as plan_name,
    ph.billing_cycle,
    ph.amount,
    ph.status,
    ph.payment_method,
    ph.paid_at,
    ph.created_at
  FROM payment_history ph
  JOIN membership_plans mp ON ph.plan_id = mp.id
  WHERE ph.user_id = user_uuid
  ORDER BY ph.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
