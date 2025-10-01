'use client'

import React from 'react'

export default function GlowCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-2xl p-6 bg-white border border-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.08)] ${className}`}
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 blur-md" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}


