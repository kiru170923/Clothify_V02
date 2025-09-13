// Manual authentication approach to avoid Supabase redirect issues

export interface ManualAuthConfig {
  currentDomain: string
  redirectUrl: string
  googleClientId: string
}

export function getManualAuthConfig(): ManualAuthConfig {
  const currentDomain = typeof window !== 'undefined' ? window.location.origin : ''
  
  // Normalize domain (remove www, hash, trailing slash)
  const normalizedDomain = currentDomain
    .replace(/^https?:\/\/(www\.)?/, 'https://')
    .replace(/\/$/, '')
    .replace(/#.*$/, '')
  
  return {
    currentDomain: normalizedDomain,
    redirectUrl: `${normalizedDomain}/auth/callback`,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  }
}

// Manual Google OAuth redirect (bypass Supabase)
export function redirectToGoogleAuth(): void {
  const config = getManualAuthConfig()
  
  console.log('🔐 Manual Google Auth Config:', config)
  
  if (!config.googleClientId) {
    throw new Error('Google Client ID not configured')
  }
  
  // Construct Google OAuth URL manually
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  
  const params = {
    client_id: config.googleClientId,
    redirect_uri: config.redirectUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: encodeURIComponent(JSON.stringify({
      domain: config.currentDomain,
      timestamp: Date.now()
    }))
  }
  
  // Add parameters to URL
  Object.entries(params).forEach(([key, value]) => {
    googleAuthUrl.searchParams.set(key, value)
  })
  
  console.log('🚀 Redirecting to Google OAuth:', googleAuthUrl.toString())
  
  // Redirect to Google
  window.location.href = googleAuthUrl.toString()
}

// Check if we're on the right domain after redirect
export function validateRedirectDomain(): boolean {
  const config = getManualAuthConfig()
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  
  // Check if we're on the correct domain (not redirected to www.clothify.top)
  const isCorrectDomain = currentUrl.startsWith(config.currentDomain)
  
  if (!isCorrectDomain) {
    console.warn('⚠️ Domain mismatch detected:', {
      expected: config.currentDomain,
      actual: currentUrl,
      redirected: true
    })
  }
  
  return isCorrectDomain
}

// Force redirect to correct domain if needed
export function forceCorrectDomain(): void {
  if (typeof window === 'undefined') return
  
  const config = getManualAuthConfig()
  const currentUrl = window.location.href
  
  // If we're on www.clothify.top but should be on clothify-v02.vercel.app
  if (currentUrl.includes('www.clothify.top') && config.currentDomain.includes('vercel.app')) {
    console.log('🔄 Forcing redirect to correct domain:', config.currentDomain)
    window.location.href = config.currentDomain
  }
  
  // If we're on www.clothify.top but should be on localhost
  if (currentUrl.includes('www.clothify.top') && config.currentDomain.includes('localhost')) {
    console.log('🔄 Forcing redirect to correct domain:', config.currentDomain)
    window.location.href = config.currentDomain
  }
}
