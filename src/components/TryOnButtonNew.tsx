'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, BoltIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useTryOn } from '../hooks/useTryOn'

interface TryOnButtonProps {
  personImage: string | null
  clothingImage: string | null
  clothingItems?: Array<{
    id: string
    image: string
    type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
    label: string
    category?: string
    color?: string
    style?: string
    confidence?: number
  }>
  selectedGarmentType?: 'auto' | 'top' | 'bottom' | 'full-body'
  onResult?: (resultImageUrl: string) => void
}

export default function TryOnButton({ 
  personImage, 
  clothingImage, 
  clothingItems,
  selectedGarmentType,
  onResult
}: TryOnButtonProps) {
  const tryOnMutation = useTryOn()
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleTryOn = async () => {
    const hasClothing = clothingItems && clothingItems.length > 0 ? clothingItems[0].image : clothingImage
    
    if (!personImage || !hasClothing) {
      toast.error('Vui lòng tải lên cả ảnh cá nhân và trang phục')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress with faster updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval)
          return 85 // Keep some progress for final result
        }
        return prev + Math.random() * 20 // Faster progress updates
      })
    }, 300) // Faster interval

    try {
      const loadingToast = toast.loading('Đang xử lý ảnh với AI... (có thể mất 2-3 phút)', {
        duration: 180000 // 3 minutes
      })

      const result = await tryOnMutation.mutateAsync({
        personImage,
        clothingImage: hasClothing,
        clothingItems,
        selectedGarmentType
      })

      toast.dismiss(loadingToast)
      console.log('TryOn Result:', result)

      if (result.success && result.resultImageUrl) {
        // Clear progress interval and set to 100%
        clearInterval(progressInterval)
        setProgress(100)
        
        // Call the onResult callback with the result image URL
        if (onResult) {
          onResult(result.resultImageUrl)
        }
        
        // Reset processing state after a short delay
        setTimeout(() => {
          setIsProcessing(false)
          setProgress(0)
        }, 2000)
      }
    } catch (error: any) {
      clearInterval(progressInterval)
      setIsProcessing(false)
      setProgress(0)
      
      console.error('Try-on error:', error)
      // Error handling is done in the mutation
    }
  }

  const hasClothing = clothingItems && clothingItems.length > 0 ? clothingItems[0] : clothingImage
  const isDisabled = !personImage || !hasClothing || isProcessing || tryOnMutation.isPending

  return (
    <div className="flex justify-center">
      <motion.button
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        onClick={handleTryOn}
        disabled={isDisabled}
        className={`
          relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300
          ${isDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
          }
        `}
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang xử lý...</span>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <SparklesIcon className="w-6 h-6" />
              <span>Thử đồ với AI</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </motion.button>
    </div>
  )
}
