'use client'

import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  message?: string
  isVisible?: boolean
}

export default function TypingIndicator({ 
  message = "AI đang suy nghĩ...", 
  isVisible = true 
}: TypingIndicatorProps) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-end gap-3 justify-start"
    >
      {/* Bot Avatar */}
      <motion.div 
        className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </motion.div>

      {/* Typing Bubble */}
      <div className="max-w-[75%] order-2">
        <motion.div
          className="relative rounded-2xl px-4 py-3 bg-white text-gray-900 border border-amber-100 shadow-lg"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Tail Pointer */}
          <div className="absolute bottom-0 left-0 transform -translate-x-1">
            <div className="w-0 h-0 border-r-[12px] border-r-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent" />
          </div>

          {/* Typing Animation */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0
                }}
              />
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.2
                }}
              />
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.4
                }}
              />
            </div>
            <span className="text-sm text-gray-600">{message}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Variant for different states
export function TypingIndicatorVariant({ 
  type = 'thinking',
  isVisible = true 
}: { 
  type?: 'thinking' | 'searching' | 'analyzing' | 'generating'
  isVisible?: boolean 
}) {
  const messages = {
    thinking: "AI đang suy nghĩ...",
    searching: "Đang tìm kiếm sản phẩm...",
    analyzing: "Đang phân tích ảnh...",
    generating: "Đang tạo gợi ý..."
  }

  const icons = {
    thinking: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    searching: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    analyzing: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    generating: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-end gap-3 justify-start"
    >
      {/* Bot Avatar with specific icon */}
      <motion.div 
        className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: type === 'analyzing' ? [0, 360] : [0, 5, -5, 0]
        }}
        transition={{ 
          duration: type === 'analyzing' ? 3 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {icons[type]}
      </motion.div>

      {/* Typing Bubble */}
      <div className="max-w-[75%] order-2">
        <motion.div
          className="relative rounded-2xl px-4 py-3 bg-white text-gray-900 border border-amber-100 shadow-lg"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Tail Pointer */}
          <div className="absolute bottom-0 left-0 transform -translate-x-1">
            <div className="w-0 h-0 border-r-[12px] border-r-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent" />
          </div>

          {/* Typing Animation */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0
                }}
              />
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.2
                }}
              />
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.4
                }}
              />
            </div>
            <span className="text-sm text-gray-600">{messages[type]}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
