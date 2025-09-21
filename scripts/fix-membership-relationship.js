const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMembershipRelationship() {
  try {
    console.log('🔍 Checking membership tables...')
    
    // Check if membership_plans table exists
    const { data: plans, error: plansError } = await supabase
      .from('membership_plans')
      .select('*')
      .limit(1)
    
    if (plansError) {
      console.log('❌ membership_plans table error:', plansError.message)
      console.log('📝 Please run the SQL script in Supabase SQL Editor:')
      console.log('1. Go to Supabase Dashboard > SQL Editor')
      console.log('2. Copy and paste the content from database/create-membership-plans-only.sql')
      console.log('3. Run the script')
      return
    }
    
    console.log('✅ membership_plans table exists')
    console.log('📊 Plans found:', plans?.length || 0)
    
    // Check if user_memberships table exists
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_memberships')
      .select('*')
      .limit(1)
    
    if (membershipsError) {
      console.log('❌ user_memberships table error:', membershipsError.message)
      console.log('📝 Please run the full membership schema in Supabase SQL Editor:')
      console.log('1. Go to Supabase Dashboard > SQL Editor')
      console.log('2. Copy and paste the content from database/membership-schema.sql')
      console.log('3. Run the script')
      return
    }
    
    console.log('✅ user_memberships table exists')
    console.log('📊 Memberships found:', memberships?.length || 0)
    
    // Test the relationship
    console.log('🔍 Testing foreign key relationship...')
    const { data: testJoin, error: joinError } = await supabase
      .from('user_memberships')
      .select(`
        *,
        plan:membership_plans(*)
      `)
      .limit(1)
    
    if (joinError) {
      console.log('❌ Foreign key relationship error:', joinError.message)
      console.log('📝 The relationship between user_memberships and membership_plans is not working')
      console.log('This might be because:')
      console.log('1. The tables were created separately')
      console.log('2. The foreign key constraint is missing')
      console.log('3. The column names don\'t match')
      return
    }
    
    console.log('✅ Foreign key relationship is working!')
    console.log('🎉 All membership tables are set up correctly!')
    
  } catch (error) {
    console.error('❌ Error checking membership tables:', error)
  }
}

fixMembershipRelationship()
