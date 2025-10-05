'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PaperAirplaneIcon, 
  PhotoIcon,
  MicrophoneIcon,
  FaceSmileIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useMobileKeyboard, TouchFeedback } from './MobileGestures'

interface MobileChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (message: string) => void
  onImageSelect: (file: File) => void
  isLoading?: boolean
  placeholder?: string
  selectedImage?: File | null
  onRemoveImage?: () => void
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

export default function MobileChatInput({
  value,
  onChange,
  onSubmit,
  onImageSelect,
  isLoading = false,
  placeholder = "Nhập tin nhắn...",
  selectedImage,
  onRemoveImage,
  suggestions = [],
  onSuggestionClick
}: MobileChatInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [value])

  // Focus input when keyboard opens
  useEffect(() => {
    if (isKeyboardOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isKeyboardOpen])

  const handleSubmit = () => {
    if (value.trim() || selectedImage) {
      onSubmit(value.trim())
      onChange('')
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageSelect(file)
    }
  }

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording)
    // TODO: Implement voice recording
  }

  const emojis = ['😊', '👍', '❤️', '🔥', '💯', '👌', '🎉', '😍', '🤔', '😅']

  const handleEmojiClick = (emoji: string) => {
    onChange(value + emoji)
    setShowEmojiPicker(false)
  }

  const quickActions = [
    { label: 'Camera', icon: PhotoIcon, action: () => fileInputRef.current?.click() },
    { label: 'Voice', icon: MicrophoneIcon, action: handleVoiceToggle },
    { label: 'Emoji', icon: FaceSmileIcon, action: () => setShowEmojiPicker(!showEmojiPicker) }
  ]

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      style={{ paddingBottom: isKeyboardOpen ? '0px' : 'env(safe-area-inset-bottom)' }}
    >
      {/* Image Preview */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-gray-50 border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="preview" 
                className="w-12 h-12 object-cover rounded-lg" 
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedImage.name}</p>
                <p className="text-xs text-gray-500">
                  {((selectedImage.size / 1024 / 1024)).toFixed(1)} MB
                </p>
              </div>
              <TouchFeedback onPress={onRemoveImage}>
                <div className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </div>
              </TouchFeedback>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-gray-50 border-b border-gray-200"
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              {suggestions.map((suggestion, index) => (
                <TouchFeedback key={index} onPress={() => onSuggestionClick?.(suggestion)}>
                  <div className="flex-shrink-0 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                    {suggestion}
                  </div>
                </TouchFeedback>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-gray-50 border-b border-gray-200"
          >
            <div className="flex gap-3">
              {quickActions.map((action, index) => (
                <TouchFeedback key={action.label} onPress={action.action}>
                  <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-lg shadow-sm">
                    <action.icon className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">{action.label}</span>
                  </div>
                </TouchFeedback>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input */}
      <div className="p-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* Plus Button */}
          <TouchFeedback onPress={() => setShowActions(!showActions)}>
            <div className={`p-3 rounded-full transition-colors ${
              showActions ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <PlusIcon className="w-5 h-5" />
            </div>
          </TouchFeedback>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none overflow-hidden text-base"
              disabled={isLoading}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            
            {/* Hidden file input */}
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleImageSelect} 
              className="hidden" 
            />

            {/* Suggestions Toggle */}
            {suggestions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-amber-500 transition-colors rounded-full hover:bg-amber-50"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Send Button */}
          <TouchFeedback onPress={handleSubmit} disabled={(!value.trim() && !selectedImage) || isLoading}>
            <div className={`p-3 rounded-full transition-all ${
              (!value.trim() && !selectedImage) || isLoading
                ? 'bg-gray-200 text-gray-400'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md'
            }`}>
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </div>
          </TouchFeedback>
        </form>
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-3 bg-white border-t border-gray-200"
          >
            <div className="grid grid-cols-5 gap-2">
              {emojis.map((emoji, index) => (
                <TouchFeedback key={index} onPress={() => handleEmojiClick(emoji)}>
                  <div className="p-3 text-lg hover:bg-gray-100 rounded-lg transition-colors text-center">
                    {emoji}
                  </div>
                </TouchFeedback>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-red-50 border-t border-red-200"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-700">Đang ghi âm...</span>
              <TouchFeedback onPress={handleVoiceToggle}>
                <div className="ml-auto text-red-500 hover:text-red-700 p-1">
                  <XMarkIcon className="w-4 h-4" />
                </div>
              </TouchFeedback>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
