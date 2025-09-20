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
            background: '#f6f1e9',
            color: '#333',
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
              background: 'linear-gradient(135deg, #FACC15, #F59E0B)',
              color: '#333',
            },
            iconTheme: {
              primary: '#333',
              secondary: '#FACC15',
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
              background: 'linear-gradient(135deg, #FACC15, #F59E0B)',
              color: '#333',
            },
            iconTheme: {
              primary: '#333',
              secondary: '#FACC15',
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
