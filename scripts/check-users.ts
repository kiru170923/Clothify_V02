/**
 * Script to check current users
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

async function checkUsers() {
  console.log('🔍 Checking users...\n')

  // Check auth.users
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const gmailUsers = authUsers?.users.filter(u => u.email?.endsWith('@gmail.com')) || []
  const oldUsers = authUsers?.users.filter(u => !u.email?.endsWith('@gmail.com')) || []

  console.log('📊 From auth.users:')
  console.log(`   Total: ${authUsers?.users.length || 0}`)
  console.log(`   Gmail users: ${gmailUsers.length}`)
  console.log(`   Old users: ${oldUsers.length}`)

  // Check public.users
  const { data: publicUsers } = await supabaseAdmin.from('users').select('email')
  const publicGmail = publicUsers?.filter(u => u.email?.endsWith('@gmail.com')).length || 0
  
  console.log('\n📊 From public.users:')
  console.log(`   Total: ${publicUsers?.length || 0}`)
  console.log(`   Gmail users: ${publicGmail}`)

  // Check user_profiles
  const { data: profiles } = await supabaseAdmin.from('user_profiles').select('user_id')
  console.log('\n📊 From user_profiles:')
  console.log(`   Total: ${profiles?.length || 0}`)

  // Show first 10 gmail users
  console.log('\n📋 First 10 Gmail users:')
  gmailUsers.slice(0, 10).forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.email}`)
  })
}

checkUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

