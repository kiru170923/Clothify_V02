'use client'

import { Toaster } from 'react-hot-toast'

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        className: '',
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          fontWeight: '500',
        },
        // Default options for specific types
        success: {
          duration: 3000,
          style: {
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
          },
          iconTheme: {
            primary: '#059669',
            secondary: '#ecfdf5',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fef2f2',
          },
        },
        loading: {
          style: {
            background: '#eff6ff',
            color: '#1e40af',
            border: '1px solid #bfdbfe',
          },
        },
      }}
    />
  )
}
