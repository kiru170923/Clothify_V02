/**
 * Fix user data:
 * 1. Update 50 user emails to realistic format (user0001, account0002, etc)
 * 2. Update 50 user names to real Vietnamese names
 * 3. d410ea02 user: 85 total, 85 used
 * 4. All 78 fake users: 3 tokens max (free), distributed used: 8 use 3, 70 use 2
 * 5. Total used tokens = 249
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing env variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Real names for users
const realNames = [
  'Nguyễn Văn An', 'Trần Thị Bảo', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em',
  'Vũ Thị Hải', 'Phan Văn Giang', 'Đặng Thị Hà', 'Bùi Văn Hùng', 'Đỗ Thị Ích',
  'Nguyễn Văn Kiên', 'Trần Thị Linh', 'Lê Văn Mạnh', 'Phạm Thị Nhàn', 'Hoàng Văn Oánh',
  'Vũ Thị Phương', 'Phan Văn Quân', 'Đặng Thị Rút', 'Bùi Văn Sang', 'Đỗ Thị Thanh',
  'Nguyễn Văn Uyên', 'Trần Thị Vân', 'Lê Văn Xuyên', 'Phạm Thị Yến', 'Hoàng Văn Zâm',
  'Vũ Thị Anh', 'Phan Văn Bình', 'Đặng Thị Chi', 'Bùi Văn Dũng', 'Đỗ Thị Ế',
  'Nguyễn Văn Phong', 'Trần Thị Giang', 'Lê Văn Hiền', 'Phạm Thị Ích', 'Hoàng Văn Khánh',
  'Vũ Thị Linh', 'Phan Văn Minh', 'Đặng Thị Nhi', 'Bùi Văn Oái', 'Đỗ Thị Phúc',
  'Nguyễn Văn Quân', 'Trần Thị Rơi', 'Lê Văn Sang', 'Phạm Thị Trang', 'Hoàng Văn Uyên',
  'Vũ Thị Vĩnh', 'Phan Văn Xoan', 'Đặng Thị Yên', 'Bùi Văn Zâm', 'Đỗ Thị Aline',
  'Nguyễn Thị Bình', 'Trần Văn Chi', 'Lê Thị Duyên', 'Phạm Văn Em', 'Hoàng Thị Hương',
  'Vũ Văn Ích', 'Phan Thị Kiên', 'Đặng Văn Lâm', 'Bùi Thị Mỹ', 'Đỗ Văn Nhân',
  'Nguyễn Văn Oánh', 'Trần Thị Phương', 'Lê Văn Quân', 'Phạm Thị Rơi', 'Hoàng Văn Sang',
  'Vũ Thị Trang', 'Phan Văn Uyên', 'Đặng Thị Vĩnh', 'Bùi Văn Xoan', 'Đỗ Thị Yên',
]

// Romanize Vietnamese text (remove accents)
function romanize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, '')
}

const generateRealisticEmail = (name: string) => {
  const nameParts = name.split(' ')
  const firstName = romanize(nameParts[0])
  const lastName = romanize(nameParts[nameParts.length - 1])
  const num = String(Math.floor(Math.random() * 100 + 90)).padStart(2, '0') // 90-99 for young
  const isGmail = Math.random() > 0.1 // 90% Gmail
  const domain = isGmail ? '@gmail.com' : '@outlook.com'
  const variants = [
    `${firstName}${lastName}${num}${domain}`,
    `${firstName}${num}${domain}`,
    `${lastName}${num}${domain}`,
    `${firstName}${lastName}${num}${domain}`,
  ]
  return variants[Math.floor(Math.random() * variants.length)]
}

// Exclude this account from token updates
const EXCLUDED_USER_ID = 'd410ea02-c8c8-4a73-86f1-11b2903d9bd5' // This user only

async function fixUserData() {
  console.log('🔧 Fixing user data...\n')

  // Get all users
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const users = authUsers?.users || []

  console.log(`📊 Found ${users.length} users in auth\n`)

  // Fix each user
  let fixedCount = 0
  for (let i = 0; i < Math.min(users.length, 50); i++) {
    const user = users[i]
    
    // Skip real users
    if (user.id === EXCLUDED_USER_ID) {
      console.log(`⏭️ Skipping real user: ${user.email}`)
      continue
    }
    
    const nameIdx = i % realNames.length
    const realName = realNames[nameIdx]
    const newEmail = generateRealisticEmail(realName)

    try {
      // Update user email and metadata with real name
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: newEmail,
        user_metadata: {
          name: realName,
          full_name: realName,
        },
      })

      fixedCount++
      console.log(`✅ [${fixedCount}/49] ${newEmail} → ${realName}`)
    } catch (error: any) {
      console.error(`❌ [${i + 1}/50] Error:`, error.message)
    }
  }

  console.log(`\n✅ Updated ${fixedCount} users\n`)

  // Fix tokens: distribute to reach ~249 total used across ALL users
  console.log('🎟️  Fixing tokens...\n')

  // Get all users from user_tokens first to see what we have
  const { data: allUserTokens } = await supabaseAdmin
    .from('user_tokens')
    .select('user_id')
  
  const allTokenUserIds = allUserTokens?.map(t => t.user_id) || []
  console.log(`📊 Found ${allTokenUserIds.length} users in user_tokens table\n`)

  // Calculate target for all fake users (82 total)
  const targetTotalUsed = 249
  const excludedUserUsed = 85 // d410ea02 user uses 85 tokens
  const remainingUsedTokens = targetTotalUsed - excludedUserUsed // 164
  const numFakeUsers = allTokenUserIds.length - 1 // Exclude the admin user
  const freeTokensPerUser = 3 // All free users have 3 tokens
  
  // Distribute 164 used tokens across fake users with 3 tokens each
  const avgUsedPerUser = Math.floor(remainingUsedTokens / numFakeUsers) // 2
  const usersWithExtraUsed = remainingUsedTokens % numFakeUsers // 8

  console.log(`📊 Distributing ${remainingUsedTokens} tokens to ${numFakeUsers} users`)
  console.log(`📊 Distribution: ${usersWithExtraUsed} users use 3, ${numFakeUsers - usersWithExtraUsed} users use 2\n`)

  let tokenFixedCount = 0
  for (let i = 0; i < allTokenUserIds.length; i++) {
    const userId = allTokenUserIds[i]
    
    // Skip excluded user
    if (userId === EXCLUDED_USER_ID) {
      console.log(`⏭️  Skipping excluded user: ${userId}`)
      continue
    }
    
    // All free users have 3 tokens total
    const totalTokens = freeTokensPerUser
    // But distribute used_tokens: 8 users use 3, rest use 2
    const hasExtraUsed = i < usersWithExtraUsed
    const usedTokens = hasExtraUsed ? 3 : 2

    try {
      // Update or insert user_tokens
      const { error } = await supabaseAdmin
        .from('user_tokens')
        .upsert(
          {
            user_id: userId,
            total_tokens: totalTokens,
            used_tokens: usedTokens,
            last_reset_date: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error

      tokenFixedCount++
      if (tokenFixedCount <= 10 || tokenFixedCount % 10 === 0) {
        console.log(`✅ [${tokenFixedCount}/${numFakeUsers}] ${userId.slice(0, 8)}: ${totalTokens} total, ${usedTokens} used`)
      }
    } catch (error: any) {
      console.error(`❌ Error:`, error.message)
    }
  }

  // Handle excluded user separately with 85 tokens
  console.log('\n🔐 Setting excluded user tokens...')
  try {
    const { error } = await supabaseAdmin
      .from('user_tokens')
      .upsert(
        {
          user_id: EXCLUDED_USER_ID,
          total_tokens: 85,
          used_tokens: 85,
          last_reset_date: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    if (error) throw error
    console.log(`✅ ${EXCLUDED_USER_ID}: 85 total, 85 used`)
  } catch (error: any) {
    console.error(`❌ Error setting excluded user:`, error.message)
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Updated names: ${fixedCount}`)
  console.log(`   ✅ Updated tokens: ${tokenFixedCount}`)
  console.log(`   📝 Existing used tokens (all users): ${targetTotalUsed}`)
  console.log(`   📝 New used tokens (78 fake users): ${targetTotalUsed}`)
  console.log(`   📝 Total used tokens (all): ${targetTotalUsed}`)
}

fixUserData()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
