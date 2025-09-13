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
  
  return {
    currentOrigin,
    redirectUrl: `${currentOrigin}/auth/callback`,
    isProduction: currentOrigin === 'https://clothify.top',
    isDevelopment: currentOrigin === 'http://localhost:3000',
    isPreview: currentOrigin.includes('vercel.app')
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
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: config.redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  
  if (error) {
    console.error('❌ Auth Error:', error)
    throw new Error(`Đăng nhập thất bại: ${error.message}`)
  }
  
  console.log('✅ Auth redirect initiated to:', config.redirectUrl)
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
