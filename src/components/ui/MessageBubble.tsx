'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface MessageBubbleProps {
  message: {
    id: string
    type: 'user' | 'bot'
    content: string
    timestamp: Date
    image?: string
    actions?: Array<{
      id: string
      label: string
      value: string
      kind: 'quick-text' | 'service' | 'link'
      autoSend?: boolean
      submitType?: 'search' | 'chat'
      href?: string
    }>
  }
  onActionClick?: (action: any) => void
  onImageClick?: (url: string, alt: string) => void
  children?: React.ReactNode
}

export default function MessageBubble({ 
  message, 
  onActionClick, 
  onImageClick, 
  children 
}: MessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = useState(false)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const cleanContent = (content: string) => {
    return content
      .replace(/┌([^┐]*)┐/g, '')
      .replace(/└([^┘]*)┘/g, '')
      .replace(/🖼️\s*\[([^\]]+)\]/g, '')
      .replace(/\[Thử ngay\]/g, '')
      .replace(/\[Mua ngay\]/g, '')
  }

  const isUser = message.type === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* Avatar */}
      {!isUser && (
        <motion.div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </motion.div>
      )}

      {/* Message Content */}
      <div className={`max-w-[75%] ${isUser ? 'order-1' : 'order-2'}`}>
        <motion.div
          className={`relative rounded-2xl px-4 py-3 shadow-lg transition-all duration-200 ${
            isUser 
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' 
              : 'bg-white text-gray-900 border border-amber-100'
          }`}
          whileHover={{ 
            scale: 1.02
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Tail Pointer */}
          <div className={`absolute bottom-0 ${
            isUser 
              ? 'right-0 transform translate-x-1' 
              : 'left-0 transform -translate-x-1'
          }`}>
            <div className={`w-0 h-0 ${
              isUser
                ? 'border-l-[12px] border-l-amber-500 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent'
                : 'border-r-[12px] border-r-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent'
            }`} />
          </div>

          {/* Message Text */}
          <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {cleanContent(message.content)}
          </div>

          {/* User Image */}
          {message.image && (
            <div className="mt-3">
              <motion.img
                src={message.image}
                alt="Uploaded"
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
                onClick={() => onImageClick?.(message.image!, 'Ảnh đã tải lên')}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
            </div>
          )}

          {/* Quick Actions */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.actions.map((action) => (
                <motion.button
                  key={action.id}
                  onClick={() => onActionClick?.(action)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                    isUser
                      ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Children (Product Cards, etc.) */}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}

          {/* Timestamp */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: showTimestamp ? 1 : 0, y: showTimestamp ? 0 : 4 }}
            transition={{ duration: 0.2 }}
            className={`text-xs mt-2 ${
              isUser ? 'text-amber-100' : 'text-gray-500'
            }`}
          >
            {formatTime(message.timestamp)}
          </motion.div>
        </motion.div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <motion.div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-xs font-semibold shadow-lg"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          Bạn
        </motion.div>
      )}
    </motion.div>
  )
}
