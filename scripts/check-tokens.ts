import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
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
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseServiceRoleKey?.slice(0, 20) + '...')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function checkTokens() {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_tokens')
      .select('user_id, total_tokens, used_tokens')

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    console.log(`\n📊 Total records: ${data?.length || 0}\n`)
    
    let totalUsed = 0
    let totalTokens = 0
    data?.forEach((t: any, i: number) => {
      if (i < 10 || data.length <= 10) {
        console.log(`${i + 1}. ${t.user_id.slice(0, 8)}: ${t.used_tokens}/${t.total_tokens}`)
      }
      totalUsed += t.used_tokens
      totalTokens += t.total_tokens
    })
    
    if (data && data.length > 10) {
      console.log(`... và ${data.length - 10} records khác`)
    }
    
    console.log(`\n✅ Total used tokens: ${totalUsed}`)
    console.log(`✅ Total tokens: ${totalTokens}`)
  } catch (error) {
    console.error('Error:', error)
  }
}

checkTokens()
