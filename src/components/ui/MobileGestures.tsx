'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'

// Swipe to delete message
interface SwipeToDeleteProps {
  children: React.ReactNode
  onDelete: () => void
  threshold?: number
  disabled?: boolean
}

export function SwipeToDelete({ 
  children, 
  onDelete, 
  threshold = 100, 
  disabled = false 
}: SwipeToDeleteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-threshold, 0], [0.5, 1])
  const scale = useTransform(x, [-threshold, 0], [0.95, 1])

  const handleDragStart = () => {
    if (disabled) return
    setIsDragging(true)
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false)
    
    if (info.offset.x < -threshold) {
      setShowDeleteButton(true)
      // Auto delete after showing button
      setTimeout(() => {
        onDelete()
        setShowDeleteButton(false)
        x.set(0)
      }, 500)
    } else {
      x.set(0)
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ x, opacity, scale }}
      className="relative"
    >
      {children}
      
      {/* Delete indicator */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium"
        >
          Xóa
        </motion.div>
      )}
    </motion.div>
  )
}

// Pull to refresh
interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  disabled?: boolean
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 80, 
  disabled = false 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, threshold], [0, 1])
  const scale = useTransform(y, [0, threshold], [0.8, 1])

  const handleDragStart = () => {
    if (disabled || isRefreshing) return
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return
    
    const currentY = info.offset.y
    if (currentY > 0) {
      setPullDistance(currentY)
    }
  }

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return
    
    if (info.offset.y > threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
        y.set(0)
      }
    } else {
      setPullDistance(0)
      y.set(0)
    }
  }

  return (
    <div className="relative">
      {/* Pull indicator */}
      <motion.div
        style={{ opacity, scale }}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex items-center gap-2 text-gray-500 text-sm"
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
          className="w-4 h-4"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.div>
        <span>{isRefreshing ? 'Đang làm mới...' : 'Kéo để làm mới'}</span>
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  )
}

// Swipe navigation for carousel
interface SwipeNavigationProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  disabled?: boolean
}

export function SwipeNavigation({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  threshold = 50, 
  disabled = false 
}: SwipeNavigationProps) {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-threshold, threshold], [0.7, 1])

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled) return
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    
    x.set(0)
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      style={{ x, opacity }}
      className="relative"
    >
      {children}
    </motion.div>
  )
}

// Touch feedback for buttons
interface TouchFeedbackProps {
  children: React.ReactNode
  onPress?: () => void
  hapticFeedback?: boolean
  disabled?: boolean
}

export function TouchFeedback({ 
  children, 
  onPress, 
  hapticFeedback = true, 
  disabled = false 
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handlePressStart = () => {
    if (disabled) return
    setIsPressed(true)
    
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10) // Light haptic feedback
    }
  }

  const handlePressEnd = () => {
    setIsPressed(false)
    if (onPress && !disabled) {
      onPress()
    }
  }

  return (
    <motion.div
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      animate={{
        scale: isPressed ? 0.95 : 1,
        opacity: disabled ? 0.5 : 1
      }}
      transition={{ duration: 0.1 }}
      className="touch-manipulation"
    >
      {children}
    </motion.div>
  )
}

// Bottom sheet for mobile
interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  height?: string
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  height = '80vh' 
}: BottomSheetProps) {
  const y = useMotionValue(0)

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose()
    } else {
      y.set(0)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg"
        style={{ height }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ y }}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// Mobile keyboard handler
export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.innerHeight
      const documentHeight = document.documentElement.clientHeight
      const heightDifference = documentHeight - viewportHeight

      if (heightDifference > 150) {
        setIsKeyboardOpen(true)
        setKeyboardHeight(heightDifference)
      } else {
        setIsKeyboardOpen(false)
        setKeyboardHeight(0)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { isKeyboardOpen, keyboardHeight }
}

// Compact mode hook
export function useCompactMode() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsCompact(window.innerWidth < 640) // sm breakpoint
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return isCompact
}
