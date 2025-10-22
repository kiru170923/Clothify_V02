/**
 * Test users API
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function testAPI() {
  console.log('🧪 Testing users API...\n')

  // Test 1: Check users table
  const { data: users, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, email, name, created_at')
    .limit(5)

  console.log('📊 Users table:')
  console.log('  Error:', usersError)
  console.log('  Count:', users?.length || 0)
  if (users && users.length > 0) {
    console.log('  Sample:', users[0])
  }

  // Test 2: Check user_profiles
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, gender, age_group')
    .limit(5)

  console.log('\n📊 User_profiles table:')
  console.log('  Error:', profilesError)
  console.log('  Count:', profiles?.length || 0)
  if (profiles && profiles.length > 0) {
    console.log('  Sample:', profiles[0])
  }

  // Test 3: Try join query
  const { data: joined, error: joinedError } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      name,
      created_at,
      user_profiles(
        gender,
        age_group
      )
    `)
    .limit(5)

  console.log('\n📊 Join query:')
  console.log('  Error:', joinedError)
  console.log('  Count:', joined?.length || 0)
  if (joined && joined.length > 0) {
    console.log('  Sample:', JSON.stringify(joined[0], null, 2))
  }
}

testAPI()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

