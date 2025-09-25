'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  PhotoIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { optimizeImageForUpload } from '../lib/imageOptimization'

interface ClothingItem {
  id: string
  image: string
  type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
  label: string
  category?: string
  color?: string
  style?: string
  confidence?: number
}

interface MultipleClothingUploadProps {
  clothingItems: ClothingItem[]
  onChange: (items: ClothingItem[]) => void
  onZoom?: (image: string) => void
}

const clothingIcons: Record<string, string> = {
  'top': '👕',
  'bottom': '👖', 
  'dress': '👗',
  'shoes': '👟',
  'accessory': '👜',
  'outerwear': '🧥'
}

const clothingLabels: Record<string, string> = {
  'top': 'Áo',
  'bottom': 'Quần',
  'dress': 'Váy/Đầm', 
  'shoes': 'Giày',
  'accessory': 'Phụ kiện',
  'outerwear': 'Áo khoác'
}

export default function MultipleClothingUpload({ 
  clothingItems, 
  onChange, 
  onZoom 
}: MultipleClothingUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)

  const detectClothingType = async (imageBase64: string): Promise<ClothingItem['type']> => {
    try {
      const response = await fetch('/api/detect-clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 })
      })
      
      const data = await response.json()
      if (data.success && data.detection) {
        return data.detection.type as ClothingItem['type']
      }
    } catch (error) {
      console.error('Detection failed:', error)
    }
    
    // Fallback to 'top' if detection fails
    return 'top'
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if already have 1 item
    if (clothingItems.length >= 1) {
      toast.error('Chỉ được tải lên 1 ảnh trang phục')
      return
    }

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
          const optimizedImage = await optimizeImageForUpload(reader.result as string, { maxSize: 1200, quality: 0.8 })
          
          // Auto-detect clothing type
          setIsDetecting(true)
          const detectedType = await detectClothingType(optimizedImage)
          setIsDetecting(false)
          
          const newItem: ClothingItem = {
            id: Date.now().toString(),
            image: optimizedImage,
            type: detectedType,
            label: clothingLabels[detectedType] || 'Trang phục'
          }
          
          onChange([...clothingItems, newItem])
          toast.success(`✅ Đã thêm ${newItem.label}!`)
        } catch (error) {
          console.error('Processing failed:', error)
          toast.error('Có lỗi xảy ra khi xử lý ảnh')
        }
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải ảnh')
      setIsUploading(false)
    }
  }, [clothingItems, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    multiple: false, // Only single image
    maxFiles: 1, // Limit to 1 clothing image
    disabled: isUploading || clothingItems.length >= 1 // Disable when 1 item uploaded
  })

  const removeItem = (id: string) => {
    const updatedItems = clothingItems.filter(item => item.id !== id)
    onChange(updatedItems)
    toast.success('🗑️ Đã xóa')
  }

  const clearAll = () => {
    onChange([])
    toast.success('🗑️ Đã xóa tất cả')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">Trang phục</h3>
          {clothingItems.length > 0 && (
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
              {clothingItems.length}
            </span>
          )}
        </div>
        {clothingItems.length > 0 && (
          <button
            onClick={clearAll}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Area - Compact */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${clothingItems.length >= 1 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
            : isDragActive 
              ? 'border-purple-400 bg-purple-50 scale-105 cursor-pointer' 
              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading || isDetecting ? (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-sm text-gray-600">
              {isDetecting ? '🔍 AI đang phân tích...' : '📤 Đang tải ảnh...'}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto bg-purple-100 rounded-lg flex items-center justify-center">
              <PhotoIcon className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-sm text-gray-600">
              {clothingItems.length >= 1 
                ? 'Đã tải lên ảnh trang phục' 
                : isDragActive 
                  ? 'Thả ảnh vào đây!' 
                  : 'Kéo thả hoặc click để thêm ảnh'
              }
            </div>
            <div className="text-xs text-gray-400">
              {clothingItems.length >= 1 
                ? 'Xóa ảnh để tải lên ảnh mới' 
                : 'AI sẽ tự động nhận biết loại trang phục'
              }
            </div>
          </div>
        )}
      </div>

      {/* Clothing Items - Compact Grid */}
      {clothingItems.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-4 gap-2">
            <AnimatePresence>
              {clothingItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square"
                >
                  <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={item.image}
                      alt={item.label}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onZoom?.(item.image)}
                    />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    <button
                      onClick={() => onZoom?.(item.image)}
                      className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors"
                    >
                      <MagnifyingGlassIcon className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded transition-colors"
                    >
                      <TrashIcon className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  
                  {/* Type badge */}
                  <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs font-medium text-gray-700 flex items-center gap-1">
                    <span className="text-xs">{clothingIcons[item.type]}</span>
                    <span className="text-xs">{clothingLabels[item.type]}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
