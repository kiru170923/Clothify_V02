'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon,
  TrashIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface ChatHeaderProps {
  onClearConversation: () => void
  onRefreshData: () => void
  onRequestRecommendations: () => void
  isLoading?: boolean
  messageCount?: number
  isOnline?: boolean
}

export default function ChatHeader({
  onClearConversation,
  onRefreshData,
  onRequestRecommendations,
  isLoading = false,
  messageCount = 0,
  isOnline = true
}: ChatHeaderProps) {
  const [showQuickActions, setShowQuickActions] = useState(false)

  const quickActions = [
    {
      label: 'Gợi ý outfit công sở',
      action: () => onRequestRecommendations(),
      icon: SparklesIcon,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Tìm quần jeans',
      action: () => onRequestRecommendations(),
      icon: ChatBubbleLeftRightIcon,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Phân tích outfit',
      action: () => onRequestRecommendations(),
      icon: QuestionMarkCircleIcon,
      color: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-amber-200 shadow-sm">
      {/* Main Header */}
      <div className="flex items-center justify-between p-4">
        {/* Bot Info */}
        <div className="flex items-center gap-3">
          <motion.div 
            className="relative w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center shadow-md"
            animate={{ 
              scale: isLoading ? [1, 1.1, 1] : 1,
              rotate: isLoading ? [0, 5, -5, 0] : 0
            }}
            transition={{ 
              duration: 2,
              repeat: isLoading ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <SparklesIcon className="w-6 h-6 text-white" />
            
            {/* Online Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              <motion.div
                className={`w-full h-full rounded-full ${
                  isOnline ? 'bg-green-400' : 'bg-gray-300'
                }`}
                animate={isOnline ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                } : {}}
                transition={{
                  duration: 2,
                  repeat: isOnline ? Infinity : 0,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>

          <div>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">
              Cố vấn thời trang nam AI
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">
                {isOnline ? 'Đang hoạt động' : 'Tạm offline'}
              </p>
              {messageCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {messageCount} tin nhắn
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Actions Toggle */}
          <motion.button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Cog6ToothIcon className="w-4 h-4 text-gray-600" />
          </motion.button>

          {/* Refresh Data */}
          <motion.button
            onClick={onRefreshData}
            disabled={isLoading}
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 disabled:opacity-50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isLoading ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
          >
            <ArrowPathIcon className="w-4 h-4 text-blue-600" />
          </motion.button>

          {/* Clear Conversation */}
          {messageCount > 1 && (
            <motion.button
              onClick={onClearConversation}
              className="group relative p-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 transition-all duration-300 border border-red-200/50 hover:border-red-300/70"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              title="Xóa hội thoại"
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              >
                <TrashIcon className="w-4 h-4 text-red-600 group-hover:text-red-700 transition-colors" />
              </motion.div>
              
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Xóa hội thoại
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
              </div>
              
              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-xl bg-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          )}

          {/* Request Recommendations */}
          <motion.button
            onClick={onRequestRecommendations}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-amber-900 rounded-full text-sm font-semibold transition-all shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Gợi ý cho tôi
          </motion.button>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-amber-200 bg-amber-50/50"
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Hành động nhanh</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    onClick={action.action}
                    disabled={isLoading}
                    className={`p-3 rounded-lg bg-gradient-to-r ${action.color} text-white text-sm font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <action.icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
