/**
 * Update created_at for gmail users to spread from day 14 to 22
 * 
 * Run: npx tsx scripts/update-created-at.ts
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

async function updateCreatedAt() {
  console.log('🔄 Updating created_at for gmail users...\n')

  // List of fake users we created
  const fakeEmails = [
    'nguyen.van.a@gmail.com', 'tran.thi.b@gmail.com', 'le.van.c@gmail.com', 'pham.thi.d@gmail.com',
    'hoang.van.e@gmail.com', 'vu.thi.f@gmail.com', 'pham.van.g@gmail.com', 'dang.thi.h@gmail.com',
    'bui.van.i@gmail.com', 'do.thi.j@gmail.com', 'minh.tuan.nv@gmail.com', 'thao.ngoc.tv@gmail.com',
    'long.hai.lv@gmail.com', 'linh.khanh.pd@gmail.com', 'duy.an.hh@gmail.com', 'mai.phuong.vt@gmail.com',
    'quang.minh.pv@gmail.com', 'thu.uyen.dt@gmail.com', 'binh.an.bv@gmail.com', 'nhu.y.do@gmail.com',
    'vietcuong.nq@gmail.com', 'thanhthao.pt@gmail.com', 'vanhung.tn@gmail.com', 'thuylinh.ld@gmail.com',
    'hoangduc.pv@gmail.com', 'myhanh.vh@gmail.com', 'dinhlong.nb@gmail.com', 'kieuoanh.dl@gmail.com',
    'baotri.bn@gmail.com', 'thanhloan.dt@gmail.com', 'khanhvy.nt@gmail.com', 'dinhquang.tp@gmail.com',
    'quynhnhu.lv@gmail.com', 'vietanh.ph@gmail.com', 'thanhtam.hv@gmail.com', 'tuyetmai.vn@gmail.com',
    'minhkhang.pd@gmail.com', 'thuytien.da@gmail.com', 'vantruong.bv@gmail.com', 'thuynhi.do@gmail.com',
    'xuanvu.nd@gmail.com', 'haiphuong.tt@gmail.com', 'ducmanh.lh@gmail.com', 'thanhnhan.pm@gmail.com',
    'quockhang.hb@gmail.com', 'minhnguyet.vl@gmail.com', 'thienloc.pb@gmail.com', 'ngocanh.dh@gmail.com',
    'hoangnam.bn@gmail.com', 'kieulan.dv@gmail.com', 'binhminh.nt@gmail.com', 'thuytrang.tv@gmail.com',
    'tuankiet.ln@gmail.com', 'baochau.ph@gmail.com', 'vanson.hm@gmail.com', 'thuyvan.vp@gmail.com',
    'ducchien.pn@gmail.com', 'hoainam.dh@gmail.com', 'minhtuan.bv@gmail.com', 'thanhnga.dto@gmail.com',
    'quanghuy.np@gmail.com', 'thuylam.td@gmail.com', 'minhdung.lh@gmail.com'
  ]

  // Get all gmail users from auth.users, filter only our fake users
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const allGmailUsers = authUsers?.users.filter(u => u.email?.endsWith('@gmail.com')) || []
  const gmailUsers = allGmailUsers.filter(u => fakeEmails.includes(u.email!))

  console.log(`📊 Found ${allGmailUsers.length} total gmail users`)
  console.log(`📊 Found ${gmailUsers.length} fake gmail users to update`)

  if (gmailUsers.length === 0) {
    console.log('❌ No gmail users found!')
    return
  }

  // Calculate dates from day 14 to 22 (month 10 = October)
  const currentYear = 2025
  const currentMonth = 9 // October is month 9 (0-indexed)
  
  const startDate = new Date(currentYear, currentMonth, 14, 0, 0, 0)
  const endDate = new Date(currentYear, currentMonth, 22, 23, 59, 59)
  
  // Calculate dates: spread users from day 14 to day 22
  const totalDays = 22 - 14 + 1 // 9 days (14, 15, 16, 17, 18, 19, 20, 21, 22)
  const usersPerDay = Math.ceil(gmailUsers.length / totalDays)

  let updatedCount = 0
  let errorCount = 0

  for (let i = 0; i < gmailUsers.length; i++) {
    const user = gmailUsers[i]
    
    try {
      // Calculate which day this user should be on (14 to 22)
      const dayIndex = Math.floor(i / usersPerDay)
      const day = Math.min(14 + dayIndex, 22) // Cap at day 22
      
      // Calculate time within the day (distribute throughout the day)
      const hour = (i % usersPerDay) * (24 / usersPerDay)
      
      // Use UTC to avoid timezone issues
      const newCreatedAt = new Date(Date.UTC(currentYear, currentMonth, day, Math.floor(hour), Math.floor((hour % 1) * 60), 0))
      
      // Update in public.users
      const { error: updateUsersError } = await supabaseAdmin
        .from('users')
        .update({ created_at: newCreatedAt.toISOString() })
        .eq('id', user.id)

      if (updateUsersError) {
        console.log(`⚠️  Warning updating users table for ${user.email}:`, updateUsersError.message)
      }

      // Update in user_profiles
      const { error: updateProfilesError } = await supabaseAdmin
        .from('user_profiles')
        .update({ created_at: newCreatedAt.toISOString() })
        .eq('user_id', user.id)

      if (updateProfilesError) {
        console.log(`⚠️  Warning updating user_profiles for ${user.email}:`, updateProfilesError.message)
      }

      updatedCount++
      const dateStr = `${newCreatedAt.getUTCFullYear()}-${String(newCreatedAt.getUTCMonth() + 1).padStart(2, '0')}-${String(newCreatedAt.getUTCDate()).padStart(2, '0')}`
      console.log(`✅ [${i + 1}/${gmailUsers.length}] Updated ${user.email} - ${dateStr}`)

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 30))

    } catch (error: any) {
      console.error(`❌ [${i + 1}/${gmailUsers.length}] Error updating ${user.email}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Updated: ${updatedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📅 Date range: 2025-10-14 to 2025-10-22`)
}

// Run the script
updateCreatedAt()
  .then(() => {
    console.log('\n🎉 Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })

