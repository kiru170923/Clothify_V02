/**
 * Script to create 83 fake users in Supabase
 * This creates users in auth.users, public.users, user_profiles, and user_tokens
 * 
 * Run: npx tsx scripts/create-83-fake-users.ts
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

interface UserData {
  email: string
  name: string
  password: string
}

const fakeUsers: UserData[] = [
  { email: 'nguyen.van.a@gmail.com', name: 'Nguyễn Văn A', password: 'TempPassword123!' },
  { email: 'tran.thi.b@gmail.com', name: 'Trần Thị B', password: 'TempPassword123!' },
  { email: 'le.van.c@gmail.com', name: 'Lê Văn C', password: 'TempPassword123!' },
  { email: 'pham.thi.d@gmail.com', name: 'Phạm Thị D', password: 'TempPassword123!' },
  { email: 'hoang.van.e@gmail.com', name: 'Hoàng Văn E', password: 'TempPassword123!' },
  { email: 'vu.thi.f@gmail.com', name: 'Vũ Thị F', password: 'TempPassword123!' },
  { email: 'pham.van.g@gmail.com', name: 'Phan Văn G', password: 'TempPassword123!' },
  { email: 'dang.thi.h@gmail.com', name: 'Đặng Thị H', password: 'TempPassword123!' },
  { email: 'bui.van.i@gmail.com', name: 'Bùi Văn I', password: 'TempPassword123!' },
  { email: 'do.thi.j@gmail.com', name: 'Đỗ Thị J', password: 'TempPassword123!' },
  { email: 'minh.tuan.nv@gmail.com', name: 'Nguyễn Văn Minh Tuấn', password: 'TempPassword123!' },
  { email: 'thao.ngoc.tv@gmail.com', name: 'Trần Văn Thảo Ngọc', password: 'TempPassword123!' },
  { email: 'long.hai.lv@gmail.com', name: 'Lê Văn Long Hải', password: 'TempPassword123!' },
  { email: 'linh.khanh.pd@gmail.com', name: 'Phạm Đức Linh Khánh', password: 'TempPassword123!' },
  { email: 'duy.an.hh@gmail.com', name: 'Hoàng Hữu Duy An', password: 'TempPassword123!' },
  { email: 'mai.phuong.vt@gmail.com', name: 'Vũ Thị Mai Phương', password: 'TempPassword123!' },
  { email: 'quang.minh.pv@gmail.com', name: 'Phan Văn Quang Minh', password: 'TempPassword123!' },
  { email: 'thu.uyen.dt@gmail.com', name: 'Đặng Thị Thu Uyên', password: 'TempPassword123!' },
  { email: 'binh.an.bv@gmail.com', name: 'Bùi Văn Bình An', password: 'TempPassword123!' },
  { email: 'nhu.y.do@gmail.com', name: 'Đỗ Thị Như Ý', password: 'TempPassword123!' },
  { email: 'vietcuong.nq@gmail.com', name: 'Nguyễn Quốc Việt Cường', password: 'TempPassword123!' },
  { email: 'thanhthao.pt@gmail.com', name: 'Phạm Thị Thanh Thảo', password: 'TempPassword123!' },
  { email: 'vanhung.tn@gmail.com', name: 'Trần Ngọc Văn Hùng', password: 'TempPassword123!' },
  { email: 'thuylinh.ld@gmail.com', name: 'Lê Đức Thủy Linh', password: 'TempPassword123!' },
  { email: 'hoangduc.pv@gmail.com', name: 'Phan Văn Hoàng Đức', password: 'TempPassword123!' },
  { email: 'myhanh.vh@gmail.com', name: 'Vũ Hữu Mỹ Hạnh', password: 'TempPassword123!' },
  { email: 'dinhlong.nb@gmail.com', name: 'Nguyễn Bá Đình Long', password: 'TempPassword123!' },
  { email: 'kieuoanh.dl@gmail.com', name: 'Đặng Lê Kiều Oanh', password: 'TempPassword123!' },
  { email: 'baotri.bn@gmail.com', name: 'Bùi Nam Bảo Trí', password: 'TempPassword123!' },
  { email: 'thanhloan.dt@gmail.com', name: 'Đỗ Thanh Loan', password: 'TempPassword123!' },
  { email: 'khanhvy.nt@gmail.com', name: 'Nguyễn Thị Khánh Vy', password: 'TempPassword123!' },
  { email: 'dinhquang.tp@gmail.com', name: 'Trần Phú Đình Quang', password: 'TempPassword123!' },
  { email: 'quynhnhu.lv@gmail.com', name: 'Lê Vũ Quỳnh Như', password: 'TempPassword123!' },
  { email: 'vietanh.ph@gmail.com', name: 'Phạm Hoàng Việt Anh', password: 'TempPassword123!' },
  { email: 'thanhtam.hv@gmail.com', name: 'Hoàng Văn Thanh Tâm', password: 'TempPassword123!' },
  { email: 'tuyetmai.vn@gmail.com', name: 'Vũ Ngọc Tuyết Mai', password: 'TempPassword123!' },
  { email: 'minhkhang.pd@gmail.com', name: 'Phan Đức Minh Khang', password: 'TempPassword123!' },
  { email: 'thuytien.da@gmail.com', name: 'Đặng Anh Thùy Tiên', password: 'TempPassword123!' },
  { email: 'vantruong.bv@gmail.com', name: 'Bùi Văn Trường', password: 'TempPassword123!' },
  { email: 'thuynhi.do@gmail.com', name: 'Đỗ Thị Thùy Nhi', password: 'TempPassword123!' },
  { email: 'xuanvu.nd@gmail.com', name: 'Nguyễn Đức Xuân Vũ', password: 'TempPassword123!' },
  { email: 'haiphuong.tt@gmail.com', name: 'Trần Thị Hải Phương', password: 'TempPassword123!' },
  { email: 'ducmanh.lh@gmail.com', name: 'Lê Hoàng Đức Mạnh', password: 'TempPassword123!' },
  { email: 'thanhnhan.pm@gmail.com', name: 'Phạm Minh Thanh Nhàn', password: 'TempPassword123!' },
  { email: 'quockhang.hb@gmail.com', name: 'Hoàng Bình Quốc Khang', password: 'TempPassword123!' },
  { email: 'minhnguyet.vl@gmail.com', name: 'Vũ Lê Minh Nguyệt', password: 'TempPassword123!' },
  { email: 'thienloc.pb@gmail.com', name: 'Phan Bảo Thiên Lộc', password: 'TempPassword123!' },
  { email: 'ngocanh.dh@gmail.com', name: 'Đặng Hữu Ngọc Anh', password: 'TempPassword123!' },
  { email: 'hoangnam.bn@gmail.com', name: 'Bùi Ngọc Hoàng Nam', password: 'TempPassword123!' },
  { email: 'kieulan.dv@gmail.com', name: 'Đỗ Văn Kiều Lan', password: 'TempPassword123!' },
  { email: 'binhminh.nt@gmail.com', name: 'Nguyễn Thanh Bình Minh', password: 'TempPassword123!' },
  { email: 'thuytrang.tv@gmail.com', name: 'Trần Vũ Thủy Trang', password: 'TempPassword123!' },
  { email: 'tuankiet.ln@gmail.com', name: 'Lê Nam Tuấn Kiệt', password: 'TempPassword123!' },
  { email: 'baochau.ph@gmail.com', name: 'Phạm Hoàng Bảo Châu', password: 'TempPassword123!' },
  { email: 'vanson.hm@gmail.com', name: 'Hoàng Mai Văn Sơn', password: 'TempPassword123!' },
  { email: 'thuyvan.vp@gmail.com', name: 'Vũ Phương Thủy Vân', password: 'TempPassword123!' },
  { email: 'ducchien.pn@gmail.com', name: 'Phan Nguyễn Đức Chiến', password: 'TempPassword123!' },
  { email: 'hoainam.dh@gmail.com', name: 'Đặng Hoài Nam', password: 'TempPassword123!' },
  { email: 'minhtuan.bv@gmail.com', name: 'Bùi Văn Minh Tuấn', password: 'TempPassword123!' },
  { email: 'thanhnga.dto@gmail.com', name: 'Đỗ Thanh Nga', password: 'TempPassword123!' },
  { email: 'quanghuy.np@gmail.com', name: 'Nguyễn Phú Quang Huy', password: 'TempPassword123!' },
  { email: 'thuylam.td@gmail.com', name: 'Trần Đức Thủy Lâm', password: 'TempPassword123!' },
  { email: 'minhdung.lh@gmail.com', name: 'Lê Hoàng Minh Dũng', password: 'TempPassword123!' },
  { email: 'thuythao.pd@gmail.com', name: 'Phạm Đức Thùy Thảo', password: 'TempPassword123!' },
  { email: 'viettuan.hn@gmail.com', name: 'Hoàng Ngọc Việt Tuấn', password: 'TempPassword123!' },
  { email: 'khanhlinh.vm@gmail.com', name: 'Vũ Mai Khánh Linh', password: 'TempPassword123!' },
  { email: 'ducphong.pb@gmail.com', name: 'Phan Bá Đức Phong', password: 'TempPassword123!' },
  { email: 'ngochoi.da@gmail.com', name: 'Đặng Anh Ngọc Hồi', password: 'TempPassword123!' },
  { email: 'vietlong.bn@gmail.com', name: 'Bùi Nam Việt Long', password: 'TempPassword123!' },
  { email: 'thanhphuong.do@gmail.com', name: 'Đỗ Thanh Phương', password: 'TempPassword123!' },
  { email: 'truonggiang.nd@gmail.com', name: 'Nguyễn Đức Trường Giang', password: 'TempPassword123!' },
  { email: 'thanhhang.tv@gmail.com', name: 'Trần Văn Thanh Hằng', password: 'TempPassword123!' },
  { email: 'quangnhat.lh@gmail.com', name: 'Lê Hoàng Quang Nhật', password: 'TempPassword123!' },
  { email: 'thuymy.pn@gmail.com', name: 'Phạm Ngọc Thùy My', password: 'TempPassword123!' },
  { email: 'hoangson.hm@gmail.com', name: 'Hoàng Mai Hoàng Sơn', password: 'TempPassword123!' },
  { email: 'kieutrang.vd@gmail.com', name: 'Vũ Đức Kiều Trang', password: 'TempPassword123!' },
  { email: 'minhdai.pb@gmail.com', name: 'Phan Bảo Minh Đại', password: 'TempPassword123!' },
  { email: 'thuclinh.dh@gmail.com', name: 'Đặng Hữu Thục Linh', password: 'TempPassword123!' },
  { email: 'vietduy.bn@gmail.com', name: 'Bùi Ngọc Việt Duy', password: 'TempPassword123!' },
  { email: 'thanhanh.do@gmail.com', name: 'Đỗ Thanh Anh', password: 'TempPassword123!' },
  { email: 'tuanhoang.nd@gmail.com', name: 'Nguyễn Đức Tuấn Hoàng', password: 'TempPassword123!' },
  { email: 'haidang.tv@gmail.com', name: 'Trần Văn Hải Đăng', password: 'TempPassword123!' },
  { email: 'thuynhan.lp@gmail.com', name: 'Lê Phương Thùy Nhân', password: 'TempPassword123!' },
]

async function createFakeUsers() {
  console.log('🚀 Starting to create 83 fake users...\n')

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < fakeUsers.length; i++) {
    const user = fakeUsers[i]
    
    try {
      // Create user in auth.users
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          full_name: user.name,
        },
      })

      if (createError) {
        if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
          console.log(`⏭️  [${i + 1}/83] Skipping ${user.email} - already exists`)
          skipCount++
        } else {
          console.error(`❌ [${i + 1}/83] Error creating ${user.email}:`, createError.message)
          errorCount++
        }
        continue
      }

      // Wait a bit for trigger to sync to public.users
      await new Promise(resolve => setTimeout(resolve, 100))

      // Create user_profile entry
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: newUser.user!.id,
          gender: Math.random() > 0.5 ? 'male' : 'female',
          age_group: ['18-25', '26-35', '36-45', '46+'][Math.floor(Math.random() * 4)],
          height_cm: Math.floor(Math.random() * 40) + 150, // 150-190cm
          weight_kg: Math.floor(Math.random() * 40) + 50,  // 50-90kg
          size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
          style_preferences: ['casual', 'formal', 'sporty'],
          favorite_colors: ['blue', 'black', 'white'],
          created_at: new Date().toISOString(),
        })

      if (profileError) {
        console.log(`⚠️  [${i + 1}/83] Profile creation warning for ${user.email}:`, profileError.message)
      }

      // Ensure user_tokens entry exists
      const { error: tokenError } = await supabaseAdmin
        .from('user_tokens')
        .upsert({
          user_id: newUser.user!.id,
          total_tokens: 5,
          used_tokens: 0,
          last_reset_date: new Date().toISOString(),
        })

      if (tokenError) {
        console.log(`⚠️  [${i + 1}/83] Token creation warning for ${user.email}:`, tokenError.message)
      }

      successCount++
      console.log(`✅ [${i + 1}/83] Created ${user.email} (${user.name})`)

      // Rate limiting - wait 50ms between requests
      await new Promise(resolve => setTimeout(resolve, 50))

    } catch (error: any) {
      console.error(`❌ [${i + 1}/83] Unexpected error for ${user.email}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Created: ${successCount}`)
  console.log(`   ⏭️  Skipped: ${skipCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total: ${successCount + skipCount + errorCount}/83`)

  // Verify final count
  const { data: allUsers, error: countError } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')

  if (!countError && allUsers) {
    console.log(`\n📈 Current total users in user_profiles: ${allUsers.length}`)
  }

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  console.log(`📈 Current total users in auth.users: ${authUsers?.users.length || 0}`)
}

// Run the script
createFakeUsers()
  .then(() => {
    console.log('\n🎉 Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })

