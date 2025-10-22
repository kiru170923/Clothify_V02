/**
 * Check old users in public.users and user_profiles
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

async function checkOldUsers() {
  console.log('🔍 Checking old users...\n')

  // Check public.users
  const { data: publicUsers } = await supabaseAdmin.from('users').select('*')
  
  console.log('📊 public.users:')
  console.log(`   Total: ${publicUsers?.length || 0}`)
  
  if (publicUsers && publicUsers.length > 0) {
    console.log('\n📋 All users in public.users:')
    publicUsers.forEach((u, i) => {
      const isGmail = u.email?.endsWith('@gmail.com')
      console.log(`   ${i + 1}. ${u.email} ${isGmail ? '(Gmail)' : '(OLD)'}`)
    })
  }

  // Check user_profiles
  const { data: profiles } = await supabaseAdmin.from('user_profiles').select('user_id')
  console.log(`\n📊 user_profiles: ${profiles?.length || 0}`)
}

checkOldUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

