export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_NEXTAUTH_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'

export const SCRAPELESS_KEY = process.env.SCRAPELESS_API_KEY || process.env.SCRAPELESS_KEY || ''

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

// Job secret for batch endpoint
export const SCRAPE_JOB_SECRET = process.env.SCRAPE_JOB_SECRET || process.env.SCRAPE_SECRET || ''


