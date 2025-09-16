'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { 
  PhotoIcon, 
  CameraIcon, 
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import CameraModal from './CameraModal'
import { optimizeImageForUpload } from '../lib/imageOptimization'

interface UploadCardProps {
  label: string
  image: string | null
  onChange: (image: string | null) => void
  type: 'person' | 'clothing'
  onZoom?: (image: string) => void
}

export default function UploadCard({ label, image, onChange, type, onZoom }: UploadCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 10MB')
      return
    }

    setIsUploading(true)
    
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          // Optimize image before setting
          const optimizedImage = await optimizeImageForUpload(reader.result as string)
          onChange(optimizedImage)
          toast.success('Tải ảnh thành công! (đã tối ưu hóa)')
        } catch (error) {
          console.error('Image optimization failed:', error)
          onChange(reader.result as string)
          toast.success('Tải ảnh thành công!')
        }
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải ảnh')
      setIsUploading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    multiple: false,
    disabled: isUploading
  })

  const handleCameraCapture = () => {
    setShowCamera(true)
  }

  const handleCameraCaptureResult = (imageDataUrl: string) => {
    onChange(imageDataUrl)
    setShowCamera(false)
  }

  const removeImage = () => {
    // Optimistic update with smooth animation
    onChange(null)
    toast.success('Đã xóa ảnh', {
      duration: 2000,
      icon: '🗑️',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    })
  }

  if (image) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative group"
      >
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 max-w-[120px] max-h-[160px] sm:max-w-[200px] sm:max-h-[267px] lg:max-w-[360px] lg:max-h-[480px] mx-auto group">
          <img
            src={image}
            alt={type === 'person' ? 'Ảnh cá nhân' : 'Trang phục'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
            onClick={() => {
              if (onZoom && image) {
                onZoom(image)
              }
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center pointer-events-none">
            <div className="flex gap-2 pointer-events-auto">
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 bg-white rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  if (onZoom && image) {
                    onZoom(image)
                  }
                }}
              >
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-600" />
              </motion.button>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 bg-white rounded-full shadow-lg hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage()
                }}
              >
                <XMarkIcon className="w-4 h-4 text-gray-600 hover:text-red-600 transition-colors" />
              </motion.button>
            </div>
          </div>

          {/* Success indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 sm:top-3 sm:right-3 w-4 h-4 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <CheckCircleIcon className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </motion.div>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-600 mt-1 sm:mt-3">
          {type === 'person' ? '✓ Ảnh cá nhân' : '✓ Trang phục'}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Drop zone */}
      <motion.div
        {...getRootProps({ refKey: 'ref' })}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative aspect-[3/4] border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 max-w-[120px] max-h-[160px] sm:max-w-[200px] sm:max-h-[267px] lg:max-w-[360px] lg:max-h-[480px] mx-auto
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
            : isDragReject 
              ? 'border-red-400 bg-red-50' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-4 text-center">
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex flex-col items-center gap-1 sm:gap-3"
              >
                <div className="w-4 h-4 sm:w-8 sm:h-8 border-2 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Đang tải...</p>
              </motion.div>
            ) : isDragActive ? (
              <motion.div
                key="drag-active"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex flex-col items-center gap-1 sm:gap-3"
              >
                <ArrowUpTrayIcon className="w-4 h-4 sm:w-8 sm:h-8 text-blue-500" />
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Thả ảnh vào đây</p>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex flex-col items-center gap-1 sm:gap-3"
              >
                <div className="w-6 h-6 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <PhotoIcon className="w-3 h-3 sm:w-6 sm:h-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 mb-0 sm:mb-1">
                    Kéo thả ảnh vào đây
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                    hoặc nhấp để chọn file
                  </p>
                </div>
                <div className="text-xs text-gray-400 hidden sm:block">
                  PNG, JPG, WEBP (tối đa 10MB)
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-1 sm:gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => (document.querySelector(`input[type="file"]`) as HTMLInputElement)?.click()}
          disabled={isUploading}
          className="flex-1 btn btn-secondary btn-xs sm:btn-sm"
        >
          <PhotoIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Chọn ảnh</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCameraCapture}
          disabled={isUploading}
          className="flex-1 btn btn-ghost btn-xs sm:btn-sm"
        >
          <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Camera</span>
        </motion.button>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCaptureResult}
        type={type}
      />
    </motion.div>
  )
}