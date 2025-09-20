'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: boolean
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  animation = true
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]'
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    rounded: 'rounded-xl'
  }

  const animationClasses = animation ? 'animate-pulse' : ''

  const style = {
    width: width || undefined,
    height: height || undefined,
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
    />
  )
}

// Image Skeleton
export function ImageSkeleton({ 
  className = '', 
  aspectRatio = 'aspect-square',
  showIcon = true 
}: { 
  className?: string
  aspectRatio?: string
  showIcon?: boolean 
}) {
  return (
    <div className={`${aspectRatio} bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
      {showIcon && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-gray-400"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </motion.div>
      )}
    </div>
  )
}

// Card Skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-6 ${className}`}>
      <div className="space-y-4">
        <Skeleton variant="rounded" height={200} />
        <div className="space-y-2">
          <Skeleton variant="text" width="75%" />
          <Skeleton variant="text" width="50%" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
        </div>
      </div>
    </div>
  )
}

// Button Skeleton
export function ButtonSkeleton({ 
  className = '',
  size = 'default'
}: { 
  className?: string
  size?: 'sm' | 'default' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    default: 'h-10 w-24',
    lg: 'h-12 w-32'
  }

  return (
    <Skeleton 
      variant="rounded" 
      className={`${sizeClasses[size]} ${className}`}
    />
  )
}

// Grid Skeleton for galleries
export function GridSkeleton({ 
  items = 6,
  columns = 3,
  className = ''
}: {
  items?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={`grid grid-cols-${columns} gap-4 ${className}`}>
      {Array.from({ length: items }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// List Skeleton
export function ListSkeleton({ 
  items = 5,
  className = ''
}: {
  items?: number
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
          <ButtonSkeleton size="sm" />
        </div>
      ))}
    </div>
  )
}

// Loading Text with animation
export function LoadingText({ 
  text = "Loading...",
  className = ""
}: {
  text?: string
  className?: string
}) {
  return (
    <motion.div
      className={`text-gray-600 font-medium ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {text}
    </motion.div>
  )
}
