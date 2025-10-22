/**
 * Script to delete 20 @gmail.com users (keeping old users safe)
 * 
 * Run: npx tsx scripts/delete-20-gmail-users.ts
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

async function delete20GmailUsers() {
  console.log('🗑️  Starting to delete 20 @gmail.com users...\n')

  // Get all users from auth.users
  const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message)
    process.exit(1)
  }

  console.log(`📊 Total users in auth.users: ${allUsers?.users.length || 0}`)

  // Filter @gmail.com users
  const gmailUsers = allUsers?.users.filter(user => user.email?.endsWith('@gmail.com')) || []
  
  console.log(`📊 Gmail users found: ${gmailUsers.length}`)
  
  // Only delete first 20 gmail users
  const usersToDelete = gmailUsers.slice(0, 20)
  
  console.log(`📊 Users to delete: ${usersToDelete.length}`)
  console.log(`📊 Gmail users to keep: ${gmailUsers.length - usersToDelete.length}\n`)

  if (usersToDelete.length === 0) {
    console.log('✅ No users to delete!')
    return
  }

  let deletedCount = 0
  let errorCount = 0

  for (let i = 0; i < usersToDelete.length; i++) {
    const user = usersToDelete[i]
    
    try {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        console.error(`❌ [${i + 1}/${usersToDelete.length}] Error deleting ${user.email}:`, deleteError.message)
        errorCount++
      } else {
        deletedCount++
        console.log(`✅ [${i + 1}/${usersToDelete.length}] Deleted ${user.email}`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50))

    } catch (error: any) {
      console.error(`❌ [${i + 1}/${usersToDelete.length}] Unexpected error for ${user.email}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Deleted: ${deletedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total: ${deletedCount + errorCount}/${usersToDelete.length}`)

  // Verify final count
  const { data: finalUsers } = await supabaseAdmin.auth.admin.listUsers()
  const remainingGmail = finalUsers?.users.filter(u => u.email?.endsWith('@gmail.com')).length || 0
  const remainingOld = (finalUsers?.users.length || 0) - remainingGmail
  
  console.log(`\n📈 Final stats:`)
  console.log(`   📧 Gmail users: ${remainingGmail}`)
  console.log(`   👤 Old users: ${remainingOld}`)
  console.log(`   📊 Total: ${finalUsers?.users.length || 0}`)
}

// Run the script
delete20GmailUsers()
  .then(() => {
    console.log('\n🎉 Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })

