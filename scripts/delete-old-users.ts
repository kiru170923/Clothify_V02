/**
 * Script to delete old users (keeping only the new @gmail.com users)
 * 
 * Run: npx tsx scripts/delete-old-users.ts
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

async function deleteOldUsers() {
  console.log('🗑️  Starting to delete old users...\n')

  // Get all users from auth.users
  const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message)
    process.exit(1)
  }

  console.log(`📊 Total users in auth.users: ${allUsers?.users.length || 0}`)

  // Filter out @gmail.com users
  const oldUsers = allUsers?.users.filter(user => !user.email?.endsWith('@gmail.com')) || []
  
  console.log(`📊 Old users to delete: ${oldUsers.length}`)
  console.log(`📊 Gmail users to keep: ${(allUsers?.users.length || 0) - oldUsers.length}\n`)

  if (oldUsers.length === 0) {
    console.log('✅ No old users to delete!')
    return
  }

  let deletedCount = 0
  let errorCount = 0

  for (let i = 0; i < oldUsers.length; i++) {
    const user = oldUsers[i]
    
    try {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        console.error(`❌ [${i + 1}/${oldUsers.length}] Error deleting ${user.email}:`, deleteError.message)
        errorCount++
      } else {
        deletedCount++
        console.log(`✅ [${i + 1}/${oldUsers.length}] Deleted ${user.email}`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50))

    } catch (error: any) {
      console.error(`❌ [${i + 1}/${oldUsers.length}] Unexpected error for ${user.email}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Deleted: ${deletedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total: ${deletedCount + errorCount}/${oldUsers.length}`)

  // Verify final count
  const { data: finalUsers } = await supabaseAdmin.auth.admin.listUsers()
  console.log(`\n📈 Final total users in auth.users: ${finalUsers?.users.length || 0}`)
}

// Run the script
deleteOldUsers()
  .then(() => {
    console.log('\n🎉 Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })

