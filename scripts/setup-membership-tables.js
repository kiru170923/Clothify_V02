const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupMembershipTables() {
  try {
    console.log('🔍 Checking if membership_plans table exists...')
    
    // Check if membership_plans table exists
    const { data: plans, error: plansError } = await supabase
      .from('membership_plans')
      .select('*')
      .limit(1)
    
    if (plansError && plansError.code === 'PGRST116') {
      console.log('❌ membership_plans table does not exist')
      console.log('📝 Please run the SQL script in Supabase SQL Editor:')
      console.log('')
      console.log('-- Copy and paste this into Supabase SQL Editor:')
      console.log('')
      console.log('-- Membership plans table')
      console.log('CREATE TABLE IF NOT EXISTS membership_plans (')
      console.log('  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,')
      console.log('  name TEXT NOT NULL,')
      console.log('  description TEXT,')
      console.log('  price_monthly INTEGER NOT NULL, -- Price in VND')
      console.log('  price_yearly INTEGER NOT NULL, -- Price in VND (monthly * 12 * 0.8)')
      console.log('  tokens_monthly INTEGER NOT NULL, -- Number of tokens per month')
      console.log('  tokens_yearly INTEGER NOT NULL, -- Number of tokens per year')
      console.log('  features JSONB DEFAULT \'[]\', -- Array of features')
      console.log('  is_active BOOLEAN DEFAULT true,')
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),')
      console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
      console.log(');')
      console.log('')
      console.log('-- Insert membership plans')
      console.log('INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features) VALUES')
      console.log('(\'Standard\', \'Gói cơ bản cho người dùng mới\', 59000, 566400, 30, 360, \'["30 ảnh/tháng", "Chất lượng HD", "Hỗ trợ email"]\'),')
      console.log('(\'Medium\', \'Gói phổ biến cho người dùng thường xuyên\', 99000, 950400, 50, 600, \'["50 ảnh/tháng", "Chất lượng HD+", "Hỗ trợ ưu tiên", "Lưu trữ 100 ảnh"]\'),')
      console.log('(\'Premium\', \'Gói cao cấp cho người dùng chuyên nghiệp\', 159000, 1526400, 100, 1200, \'["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access"]\');')
      console.log('')
      console.log('-- Enable RLS')
      console.log('ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('-- Create policy')
      console.log('CREATE POLICY "Membership plans are viewable by authenticated users" ON membership_plans')
      console.log('  FOR SELECT USING (auth.role() = \'authenticated\');')
      console.log('')
      return
    }
    
    if (plansError) {
      console.error('❌ Error checking membership_plans table:', plansError)
      return
    }
    
    console.log('✅ membership_plans table exists')
    console.log('📊 Current plans:', plans?.length || 0)
    
    // Check if user_memberships table exists
    console.log('🔍 Checking if user_memberships table exists...')
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_memberships')
      .select('*')
      .limit(1)
    
    if (membershipsError && membershipsError.code === 'PGRST116') {
      console.log('❌ user_memberships table does not exist')
      console.log('📝 Please also create the user_memberships table in Supabase SQL Editor')
      return
    }
    
    if (membershipsError) {
      console.error('❌ Error checking user_memberships table:', membershipsError)
      return
    }
    
    console.log('✅ user_memberships table exists')
    console.log('📊 Current memberships:', memberships?.length || 0)
    
    console.log('🎉 All membership tables are set up correctly!')
    
  } catch (error) {
    console.error('❌ Error setting up membership tables:', error)
  }
}

setupMembershipTables()
