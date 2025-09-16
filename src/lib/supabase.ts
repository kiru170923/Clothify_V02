import { createClient } from '@supabase/supabase-js'

// Debug what we're getting
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Environment Variables Check:', {
  supabaseUrl: supabaseUrl || 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? 'EXISTS' : 'MISSING',
  supabaseServiceKey: supabaseServiceKey ? 'EXISTS' : 'MISSING'
})

// Use fallback values for now to fix the immediate issue
const finalSupabaseUrl = supabaseUrl || 'https://qriiosvdowitaigzvwfo.supabase.co'
const finalSupabaseAnonKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaWlvc3Zkb3dpdGFpZ3p2d2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NTYwNjYsImV4cCI6MjA3MzMzMjA2Nn0.nOY6rX_Uw7vcggOs1RSJPa_zdPAnoGl1ERf2DFIHnLA'
const finalSupabaseServiceKey = supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaWlvc3Zkb3dpdGFpZ3p2d2ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc1NjA2NiwiZXhwIjoyMDczMzMyMDY2fQ.wsZezd4hkYc9pjlLW_bGOC2i55bRPPiz8OOeGeYfJps'

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey)

// Server-side client for API routes
export const supabaseAdmin = createClient(finalSupabaseUrl, finalSupabaseServiceKey)
