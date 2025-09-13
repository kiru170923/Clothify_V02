'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, BoltIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useSupabase } from './SupabaseProvider'
import { supabase } from '@/lib/supabase'

interface TryOnButtonProps {
  personImage: string | null
  clothingImage: string | null
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  onResult?: (resultImageUrl: string) => void
}

export default function TryOnButton({ 
  personImage, 
  clothingImage, 
  isProcessing, 
  setIsProcessing,
  onResult
}: TryOnButtonProps) {
  const { user } = useSupabase()
  const [progress, setProgress] = useState(0)

  const handleTryOn = async () => {
    if (!personImage || !clothingImage) {
      toast.error('Vui lòng tải lên cả ảnh cá nhân và trang phục')
      return
    }

    if (!user) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này')
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

      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Không thể lấy token xác thực')
      }

      const response = await fetch('/api/clothify/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          personImage,
          clothingImage
        })
      })

      const data = await response.json()
      toast.dismiss(loadingToast)

      if (response.status === 202) {
        // Task is processing, show timeout message
        toast.success('Task đã được tạo! Đang xử lý, vui lòng chờ...', {
          duration: 5000
        })
        setIsProcessing(false)
        return
      }

      if (data.success) {
        setProgress(100)
        toast.success('🎉 Tạo ảnh thành công!', {
          duration: 3000
        })
        
        // Trigger callback to show result
        if (onResult && data.resultImage) {
          onResult(data.resultImage)
        }
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error: any) {
      console.error('Try-on error:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi xử lý ảnh')
    } finally {
      clearInterval(progressInterval)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const isDisabled = !personImage || !clothingImage || isProcessing || !user

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-100 rounded-full h-2 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-center text-sm text-gray-600">
              Đang xử lý... {Math.round(progress)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        onClick={handleTryOn}
        disabled={isDisabled}
        className={`
          relative w-full btn btn-xl overflow-hidden font-semibold
          ${isDisabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'btn-primary shadow-2xl glow-blue'
          }
        `}
      >
        {/* Background animation */}
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ opacity: 0.3 }}
          />
        )}

        {/* Button content */}
        <div className="relative flex items-center justify-center gap-3">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-3"
              >
                <div className="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <span>Đang tạo ảnh...</span>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-3"
              >
                <SparklesIcon className="w-6 h-6" />
                <span>Tạo ảnh thử đồ</span>
                <BoltIcon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Shine effect */}
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transform: 'skewX(-20deg)' }}
          />
        )}
      </motion.button>


      {/* Help text */}
      {!user && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500"
        >
          Vui lòng đăng nhập để sử dụng tính năng AI
        </motion.p>
      )}

      {(!personImage || !clothingImage) && user && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500"
        >
          Tải lên cả ảnh cá nhân và trang phục để bắt đầu
        </motion.p>
      )}
    </div>
  )
}