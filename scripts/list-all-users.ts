/**
 * List all users from all tables
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

async function listAllUsers() {
  console.log('🔍 Listing all users...\n')

  // Get auth.users
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  
  // Get public.users  
  const { data: publicUsers } = await supabaseAdmin.from('users').select('*')
  
  // Get user_profiles
  const { data: profiles } = await supabaseAdmin.from('user_profiles').select('*')

  console.log('📊 auth.users:', authUsers?.users.length || 0)
  console.log('📊 public.users:', publicUsers?.length || 0)
  console.log('📊 user_profiles:', profiles?.length || 0)

  // Find users in user_profiles but not in auth.users
  const authUserIds = new Set(authUsers?.users.map(u => u.id) || [])
  const orphanProfiles = profiles?.filter(p => !authUserIds.has(p.user_id)) || []

  console.log(`\n🔍 Orphan profiles (no auth.users): ${orphanProfiles.length}`)
  
  if (orphanProfiles.length > 0) {
    console.log('\n📋 First 10 orphan profiles:')
    orphanProfiles.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.user_id}`)
    })
  }
}

listAllUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

