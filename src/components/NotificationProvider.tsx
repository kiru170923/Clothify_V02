'use client'

import { Toaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from 'sonner'

export default function NotificationProvider() {
  return (
    <>
      {/* React Hot Toast */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(8px)',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            style: {
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
          loading: {
            style: {
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#6366F1',
            },
          },
        }}
      />

      {/* Sonner Toast (backup) */}
      <SonnerToaster 
        position="bottom-right"
        richColors
        closeButton
        duration={4000}
        theme="dark"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          }
        }}
      />
    </>
  )
}
