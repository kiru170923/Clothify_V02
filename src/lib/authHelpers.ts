// Authentication helper utilities

export interface AuthConfig {
  currentOrigin: string
  redirectUrl: string
  isProduction: boolean
  isDevelopment: boolean
  isPreview: boolean
}

export function getAuthConfig(): AuthConfig {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  
  // Normalize origin (remove trailing slash, hash, but keep www for clothify.top)
  let normalizedOrigin = currentOrigin
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/#.*$/, '') // Remove hash and everything after
  
  // Special handling for clothify.top - convert www.clothify.top to clothify.top
  if (normalizedOrigin === 'https://www.clothify.top') {
    normalizedOrigin = 'https://clothify.top'
  }
  
  return {
    currentOrigin: normalizedOrigin,
    redirectUrl: `${normalizedOrigin}/auth/callback`,
    isProduction: normalizedOrigin === 'https://clothify.top',
    isDevelopment: normalizedOrigin === 'http://localhost:3000',
    isPreview: normalizedOrigin.includes('vercel.app')
  }
}

export function getAuthRedirectUrl(): string {
  const config = getAuthConfig()
  return config.redirectUrl
}

export function logAuthInfo(): void {
  const config = getAuthConfig()
  console.log('🔐 Auth Configuration:', {
    origin: config.currentOrigin,
    redirectUrl: config.redirectUrl,
    environment: config.isProduction ? 'Production' : config.isDevelopment ? 'Development' : 'Preview'
  })
}

// Enhanced sign in with proper redirect handling
export async function signInWithGoogle(supabase: any): Promise<void> {
  const config = getAuthConfig()
  
  logAuthInfo()
  
  // Force redirect URL to current domain (prevent www.clothify.top redirect)
  const forceRedirectUrl = config.redirectUrl
  
  console.log('🚀 Initiating Google OAuth with:', {
    provider: 'google',
    redirectTo: forceRedirectUrl,
    currentOrigin: window.location.origin,
    normalizedOrigin: config.currentOrigin
  })
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: forceRedirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      // Force redirect to current domain
      skipBrowserRedirect: false
    }
  })
  
  if (error) {
    console.error('❌ Auth Error:', error)
    throw new Error(`Đăng nhập thất bại: ${error.message}`)
  }
  
  console.log('✅ Auth redirect initiated to:', forceRedirectUrl)
}

// Check if current URL is in allowed domains
export function isAllowedDomain(): boolean {
  const config = getAuthConfig()
  
  const allowedDomains = [
    'https://clothify.top',
    'https://clothify-v02.vercel.app',
    'http://localhost:3000'
  ]
  
  return allowedDomains.includes(config.currentOrigin)
}

// Get environment-specific configuration
export function getEnvironmentConfig() {
  const config = getAuthConfig()
  
  if (config.isProduction) {
    return {
      name: 'Production',
      domain: 'clothify.top',
      color: 'green'
    }
  } else if (config.isDevelopment) {
    return {
      name: 'Development',
      domain: 'localhost:3000',
      color: 'blue'
    }
  } else if (config.isPreview) {
    return {
      name: 'Preview',
      domain: 'vercel.app',
      color: 'orange'
    }
  }
  
  return {
    name: 'Unknown',
    domain: 'unknown',
    color: 'gray'
  }
}
