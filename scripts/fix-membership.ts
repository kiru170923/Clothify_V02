import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = envContent.split('\n').reduce((acc: any, line: string) => {
  const [key, value] = line.split('=')
  if (key && value) {
    acc[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
  }
  return acc
}, {})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing env variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function fixMembership() {
  try {
    console.log('🔧 Fixing membership data...\n')

    // Get all payments to understand the data
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('status', 'completed')

    if (paymentsError) throw paymentsError

    console.log(`📊 Found ${payments?.length || 0} completed payments\n`)
    
    payments?.forEach((p: any, i: number) => {
      console.log(`${i + 1}. Amount: ${p.amount}, Desc: "${p.description}", User: ${p.user_id?.slice(0, 8) || 'N/A'}`)
    })

    console.log()

    // Get all membership plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('membership_plans')
      .select('*')

    if (plansError) throw plansError

    console.log(`\n📊 Found ${plans?.length || 0} membership plans:`)
    plans?.forEach((p: any) => {
      console.log(`  - ${p.name} (${p.id}): ${p.price_monthly}`)
    })

    console.log('\n✅ Data loaded successfully')

    // Match payments to plans by amount and create memberships
    console.log('\n🔧 Creating membership records...\n')

    const amountToPlan: Record<number, string> = {
      59000: 'Standard',
      99000: 'Medium',
      159000: 'Premium',
    }

    const membershipCounts: Record<string, any> = {
      'Standard': { count: 0, plan_id: '' },
      'Medium': { count: 0, plan_id: '' },
      'Premium': { count: 0, plan_id: '' },
    }

    // Map plan IDs
    plans?.forEach((p: any) => {
      if (p.name === 'Standard') membershipCounts['Standard'].plan_id = p.id
      if (p.name === 'Medium') membershipCounts['Medium'].plan_id = p.id
      if (p.name === 'Premium') membershipCounts['Premium'].plan_id = p.id
    })

    // Count payments by plan
    payments?.forEach((p: any) => {
      const planName = amountToPlan[p.amount]
      if (planName && membershipCounts[planName]) {
        membershipCounts[planName].count++
      }
    })

    console.log('📋 Membership breakdown:')
    Object.entries(membershipCounts).forEach(([name, data]: [string, any]) => {
      console.log(`  ${name}: ${data.count} active users`)
    })

    // Clear old memberships
    console.log('\n🔄 Clearing old membership records...')
    const { error: deleteError } = await supabaseAdmin
      .from('user_memberships')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!deleteError) {
      console.log('✅ Old records cleared')
    }

    // Get first few users to assign memberships
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(10)

    console.log(`\n📝 Creating membership records for ${users?.length || 0} users...\n`)

    let createdCount = 0
    let userIndex = 0

    for (const [planName, data] of Object.entries(membershipCounts)) {
      for (let i = 0; i < data.count; i++) {
        if (userIndex >= (users?.length || 0)) break

        const user = users?.[userIndex]
        if (!user) break

        const { error } = await supabaseAdmin
          .from('user_memberships')
          .insert({
            user_id: user.id,
            plan_id: data.plan_id,
            status: 'active',
          })

        if (!error) {
          console.log(`✅ [${createdCount + 1}] ${planName} → ${user.id.slice(0, 8)}`)
          createdCount++
        } else {
          console.log(`⚠️ Error:`, error.message)
        }

        userIndex++
      }
    }

    console.log(`\n🎉 Created ${createdCount} membership records!`)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixMembership()
