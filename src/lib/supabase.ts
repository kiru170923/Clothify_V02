import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qriiosvdowitaigzvwfo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaWlvc3Zkb3dpdGFpZ3p2d2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NTYwNjYsImV4cCI6MjA3MzMzMjA2Nn0.nOY6rX_Uw7vcggOs1RSJPa_zdPAnoGl1ERf2DFIHnLA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for API routes
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaWlvc3Zkb3dpdGFpZ3p2d2ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc1NjA2NiwiZXhwIjoyMDczMzMyMDY2fQ.wsZezd4hkYc9pjlLW_bGOC2i55bRPPiz8OOeGeYfJps'
)
