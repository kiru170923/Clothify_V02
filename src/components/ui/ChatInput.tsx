'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PaperAirplaneIcon, 
  PhotoIcon,
  MicrophoneIcon,
  FaceSmileIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface ChatInputProps {
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

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onImageSelect,
  isLoading = false,
  placeholder = "Nhập câu hỏi thời trang nam...",
  selectedImage,
  onRemoveImage,
  suggestions = [],
  onSuggestionClick
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [value])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() || selectedImage) {
      onSubmit(value.trim())
      onChange('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
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

  return (
    <div className="p-4 border-t border-amber-200 bg-white/90 backdrop-blur-sm">
      {/* Image Preview */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="preview" 
                className="w-16 h-16 object-cover rounded-lg" 
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{selectedImage.name}</p>
                <p className="text-xs text-gray-500">
                  {((selectedImage.size / 1024 / 1024)).toFixed(1)} MB
                </p>
              </div>
              <button 
                onClick={onRemoveImage}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Gợi ý:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-12 border border-amber-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none overflow-hidden"
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

          {/* Action buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors rounded-full hover:bg-amber-50"
              disabled={isLoading}
            >
              <PhotoIcon className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-1.5 transition-colors rounded-full ${
                isRecording 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
              disabled={isLoading}
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors rounded-full hover:bg-amber-50"
              disabled={isLoading}
            >
              <FaceSmileIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={(!value.trim() && !selectedImage) || isLoading}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </motion.button>
      </form>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 p-3 bg-white border border-amber-200 rounded-lg shadow-lg"
          >
            <div className="grid grid-cols-5 gap-2">
              {emojis.map((emoji, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-2 text-lg hover:bg-amber-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {emoji}
                </motion.button>
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
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-700">Đang ghi âm...</span>
              <button
                onClick={handleVoiceToggle}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
