'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

// Message send animation
export function MessageSendAnimation({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 rounded-full shadow-lg">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.div>
          <span className="text-sm font-medium">Đang gửi...</span>
        </div>
      </div>
    </motion.div>
  )
}

// Smooth scroll to bottom
export function SmoothScrollToBottom({ 
  messagesEndRef, 
  shouldScroll 
}: { 
  messagesEndRef: React.RefObject<HTMLDivElement>
  shouldScroll: boolean 
}) {
  useEffect(() => {
    if (shouldScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [shouldScroll, messagesEndRef])

  return null
}

// Read receipts
export function ReadReceipt({ 
  isRead, 
  timestamp 
}: { 
  isRead: boolean
  timestamp: Date 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-1 mt-1"
    >
      <div className={`w-2 h-2 rounded-full ${
        isRead ? 'bg-blue-500' : 'bg-gray-300'
      }`} />
      <span className="text-xs text-gray-500">
        {isRead ? 'Đã đọc' : 'Đã gửi'} • {timestamp.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>
    </motion.div>
  )
}

// Reaction emojis
export function ReactionEmojis({ 
  onReaction 
}: { 
  onReaction: (emoji: string) => void 
}) {
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡']

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-1 p-2 bg-white border border-gray-200 rounded-full shadow-lg"
    >
      {reactions.map((emoji, index) => (
        <motion.button
          key={emoji}
          onClick={() => onReaction(emoji)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <span className="text-lg">{emoji}</span>
        </motion.button>
      ))}
    </motion.div>
  )
}

// Message reactions display
export function MessageReactions({ 
  reactions 
}: { 
  reactions: Array<{ emoji: string, count: number }> 
}) {
  if (reactions.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex gap-1 mt-2"
    >
      {reactions.map((reaction, index) => (
        <motion.div
          key={`${reaction.emoji}-${index}`}
          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
          whileHover={{ scale: 1.05 }}
        >
          <span>{reaction.emoji}</span>
          <span className="text-gray-600">{reaction.count}</span>
        </motion.div>
      ))}
    </motion.div>
  )
}

// Typing indicator with user names
export function TypingUsers({ 
  users 
}: { 
  users: string[] 
}) {
  if (users.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 text-sm text-gray-600"
    >
      <div className="flex gap-1">
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span>
        {users.length === 1 
          ? `${users[0]} đang nhập...`
          : `${users.length} người đang nhập...`
        }
      </span>
    </motion.div>
  )
}

// Message status indicator
export function MessageStatus({ 
  status 
}: { 
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' 
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full"
          />
        )
      case 'sent':
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />
      case 'delivered':
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />
      case 'read':
        return <div className="w-3 h-3 bg-blue-500 rounded-full" />
      case 'failed':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'sending': return 'Đang gửi'
      case 'sent': return 'Đã gửi'
      case 'delivered': return 'Đã nhận'
      case 'read': return 'Đã đọc'
      case 'failed': return 'Gửi thất bại'
      default: return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1 mt-1"
    >
      {getStatusIcon()}
      <span className="text-xs text-gray-500">{getStatusText()}</span>
    </motion.div>
  )
}

// Floating action button
export function FloatingActionButton({ 
  onClick, 
  icon, 
  label 
}: { 
  onClick: () => void
  icon: React.ReactNode
  label: string 
}) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-20 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </motion.button>
  )
}

// Notification toast
export function NotificationToast({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose 
}: { 
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  isVisible: boolean
  onClose: () => void 
}) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-white'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 ${getTypeStyles()} px-6 py-3 rounded-full shadow-lg z-50`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{message}</span>
            <button
              onClick={onClose}
              className="ml-2 hover:bg-white/20 rounded-full p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Loading skeleton for messages
export function MessageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-end gap-3 justify-start"
    >
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      <div className="max-w-[75%]">
        <div className="bg-gray-200 rounded-2xl px-4 py-3">
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Pulse animation for important elements
export function PulseAnimation({ 
  children, 
  isActive 
}: { 
  children: React.ReactNode
  isActive: boolean 
}) {
  return (
    <motion.div
      animate={isActive ? {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 0 0 rgba(245, 158, 11, 0.4)',
          '0 0 0 10px rgba(245, 158, 11, 0)',
          '0 0 0 0 rgba(245, 158, 11, 0)'
        ]
      } : {}}
      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
    >
      {children}
    </motion.div>
  )
}
