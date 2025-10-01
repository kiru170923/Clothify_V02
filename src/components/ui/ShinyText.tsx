'use client'

import React from 'react'

export default function ShinyText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent ${className}`}>{children}</span>
  )
}


