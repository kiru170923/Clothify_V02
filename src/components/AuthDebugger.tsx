'use client'

import { useEffect, useState } from 'react'
import { getAuthConfig, logAuthInfo } from '../lib/authHelpers'
import { getManualAuthConfig, validateRedirectDomain, forceCorrectDomain } from '../lib/manualAuth'

export default function AuthDebugger() {
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [manualAuthInfo, setManualAuthInfo] = useState<any>(null)
  const [isValidDomain, setIsValidDomain] = useState<boolean>(true)

  useEffect(() => {
    // Get auth configuration info
    const config = getAuthConfig()
    const manualConfig = getManualAuthConfig()
    const isValid = validateRedirectDomain()
    
    setAuthInfo(config)
    setManualAuthInfo(manualConfig)
    setIsValidDomain(isValid)
    
    // Force correct domain if needed
    forceCorrectDomain()
    
    // Log all info
    logAuthInfo()
    console.log('🔧 Manual Auth Config:', manualConfig)
    console.log('✅ Domain Valid:', isValid)
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔐 Auth Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Current URL:</strong><br />
          <code className="text-blue-300">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</code>
        </div>
        
        <div>
          <strong>Auth Config:</strong><br />
          <code className="text-green-300">{authInfo?.currentOrigin}</code>
        </div>
        
        <div>
          <strong>Redirect URL:</strong><br />
          <code className="text-yellow-300">{authInfo?.redirectUrl}</code>
        </div>
        
        <div>
          <strong>Environment:</strong><br />
          <span className={`px-2 py-1 rounded text-xs ${
            authInfo?.isProduction ? 'bg-green-600' : 
            authInfo?.isDevelopment ? 'bg-blue-600' : 
            'bg-orange-600'
          }`}>
            {authInfo?.isProduction ? 'Production' : 
             authInfo?.isDevelopment ? 'Development' : 'Preview'}
          </span>
        </div>
        
        <div>
          <strong>Domain Valid:</strong><br />
          <span className={`px-2 py-1 rounded text-xs ${
            isValidDomain ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {isValidDomain ? 'Valid' : 'Invalid'}
          </span>
        </div>
        
        <div>
          <strong>Manual Config:</strong><br />
          <code className="text-purple-300">{manualAuthInfo?.currentDomain}</code>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-600">
        <button
          onClick={() => {
            console.log('🔍 Full Debug Info:', {
              authInfo,
              manualAuthInfo,
              isValidDomain,
              currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
              userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
            })
          }}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Log Full Info
        </button>
      </div>
    </div>
  )
}
