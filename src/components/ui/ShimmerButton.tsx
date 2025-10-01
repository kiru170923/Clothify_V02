'use client'

import React from 'react'

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export default function ShimmerButton({ children, className = '', ...props }: ShimmerButtonProps) {
  return (
    <button
      {...props}
      className={`relative inline-flex items-center justify-center rounded-full px-6 py-3 text-amber-900 font-semibold shadow-lg overflow-hidden bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 transition-all ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 rounded-full opacity-60" style={{ boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)' }} />
      <span className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
        <span className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shine_1.6s_linear_infinite]" />
      </span>
      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </button>
  )
}


