'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  CameraIcon, 
  PhotoIcon,
  SparklesIcon,
  ArrowPathIcon,
  StarIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useVirtualTryOn } from '@/lib/virtualTryOn'

interface VirtualTryOnProps {
  onResult?: (result: any) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export default function VirtualTryOn({ 
  onResult, 
  onError,
  disabled = false 
}: VirtualTryOnProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [personImage, setPersonImage] = useState<string | null>(null)
  const [clothingImage, setClothingImage] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [showHistory, setShowHistory] = useState(false)
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>('')
  
  const personInputRef = useRef<HTMLInputElement>(null)
  const clothingInputRef = useRef<HTMLInputElement>(null)
  
  const {
    tryOnClothing,
    loadHistory,
    getHistory,
    rateTryOn,
    getTryOnStats
  } = useVirtualTryOn()

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handlePersonImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPersonImage(e.target?.result as string)
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClothingImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setClothingImage(e.target?.result as string)
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTryOn = async () => {
    if (!personImage || !clothingImage) {
      setError('Vui lòng chọn cả ảnh người và ảnh trang phục')
      return
    }

    setIsProcessing(true)
    setError('')
    setResult(null)

    try {
      const tryOnResult = await tryOnClothing({
        personImageUrl: personImage,
        clothingImageUrl: clothingImage,
        options: {
          preserveBackground: true,
          adjustLighting: true,
          enhanceQuality: true,
          style: 'realistic'
        }
      })

      if (tryOnResult.success) {
        setResult(tryOnResult)
        onResult?.(tryOnResult)
      } else {
        setError(tryOnResult.error || 'Thử đồ ảo thất bại')
        onError?.(tryOnResult.error || 'Thử đồ ảo thất bại')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRateResult = async () => {
    if (result && rating > 0) {
      const success = rateTryOn(result.id || 'temp', rating, feedback)
      if (success) {
        setRating(0)
        setFeedback('')
        // Show success message
      }
    }
  }

  const handleReset = () => {
    setPersonImage(null)
    setClothingImage(null)
    setResult(null)
    setError('')
    setRating(0)
    setFeedback('')
  }

  const history = getHistory()
  const stats = getTryOnStats()

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Person Image Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Ảnh người mẫu
          </label>
          <div className="relative">
            {personImage ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={personImage}
                  alt="Person"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setPersonImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => personInputRef.current?.click()}
                className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <div className="text-center">
                  <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Chọn ảnh người mẫu</p>
                </div>
              </div>
            )}
            <input
              ref={personInputRef}
              type="file"
              accept="image/*"
              onChange={handlePersonImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Clothing Image Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Ảnh trang phục
          </label>
          <div className="relative">
            {clothingImage ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={clothingImage}
                  alt="Clothing"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setClothingImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => clothingInputRef.current?.click()}
                className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <div className="text-center">
                  <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Chọn ảnh trang phục</p>
                </div>
              </div>
            )}
            <input
              ref={clothingInputRef}
              type="file"
              accept="image/*"
              onChange={handleClothingImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          onClick={handleTryOn}
          disabled={disabled || isProcessing || !personImage || !clothingImage}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            disabled || isProcessing || !personImage || !clothingImage
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
          }`}
          whileHover={{ scale: disabled || isProcessing || !personImage || !clothingImage ? 1 : 1.05 }}
          whileTap={{ scale: disabled || isProcessing || !personImage || !clothingImage ? 1 : 0.95 }}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Đang xử lý...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5" />
              <span>Thử đồ ảo</span>
            </div>
          )}
        </motion.button>

        <motion.button
          onClick={handleReset}
          disabled={disabled || isProcessing}
          className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          whileHover={{ scale: disabled || isProcessing ? 1 : 1.05 }}
          whileTap={{ scale: disabled || isProcessing ? 1 : 0.95 }}
        >
          <ArrowPathIcon className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Kết quả thử đồ ảo
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span>Độ tin cậy: {Math.round(result.confidence * 100)}%</span>
                <span>•</span>
                <span>Thời gian: {result.processingTime}ms</span>
              </div>
            </div>

            <div className="relative w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200">
              <Image
                src={result.resultImageUrl}
                alt="Try-on result"
                fill
                className="object-cover"
              />
            </div>

            {/* Rating Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Đánh giá kết quả
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <StarIcon className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhận xét về kết quả..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
              
              <button
                onClick={handleRateResult}
                disabled={rating === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Gửi đánh giá
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats and History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stats */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Thống kê</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng số lần thử:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thành công:</span>
              <span className="font-medium">{stats.successful}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đánh giá TB:</span>
              <span className="font-medium">{stats.averageRating.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trang phục phổ biến:</span>
              <span className="font-medium">{stats.mostPopularClothing}</span>
            </div>
          </div>
        </div>

        {/* History Toggle */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">Lịch sử</h4>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showHistory ? 'Ẩn' : 'Xem'} lịch sử
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {history.length} kết quả đã lưu
          </p>
        </div>
      </div>

      {/* History Display */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="font-medium text-gray-800">Lịch sử thử đồ</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.slice(0, 6).map((entry) => (
                <div key={entry.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2">
                    <Image
                      src={entry.resultImageUrl}
                      alt="Try-on result"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Loại: {entry.metadata.clothingType}</p>
                    <p>Màu: {entry.metadata.color}</p>
                    <p>Phong cách: {entry.metadata.style}</p>
                    {entry.rating && (
                      <div className="flex items-center gap-1">
                        <span>Đánh giá:</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`w-3 h-3 ${
                                star <= entry.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact version for mobile
export function VirtualTryOnCompact({ 
  onResult, 
  onError,
  disabled = false 
}: VirtualTryOnProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [personImage, setPersonImage] = useState<string | null>(null)
  const [clothingImage, setClothingImage] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  
  const personInputRef = useRef<HTMLInputElement>(null)
  const clothingInputRef = useRef<HTMLInputElement>(null)
  
  const { tryOnClothing } = useVirtualTryOn()

  const handlePersonImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPersonImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClothingImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setClothingImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTryOn = async () => {
    if (!personImage || !clothingImage) return

    setIsProcessing(true)
    try {
      const tryOnResult = await tryOnClothing({
        personImageUrl: personImage,
        clothingImageUrl: clothingImage
      })

      if (tryOnResult.success) {
        setResult(tryOnResult)
        onResult?.(tryOnResult)
      } else {
        onError?.(tryOnResult.error || 'Thử đồ ảo thất bại')
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Lỗi không xác định')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Image Uploads */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => personInputRef.current?.click()}
          className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
        >
          {personImage ? (
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              <Image
                src={personImage}
                alt="Person"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <CameraIcon className="w-8 h-8 text-gray-400" />
          )}
          <input
            ref={personInputRef}
            type="file"
            accept="image/*"
            onChange={handlePersonImageUpload}
            className="hidden"
          />
        </div>

        <div
          onClick={() => clothingInputRef.current?.click()}
          className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
        >
          {clothingImage ? (
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              <Image
                src={clothingImage}
                alt="Clothing"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <PhotoIcon className="w-8 h-8 text-gray-400" />
          )}
          <input
            ref={clothingInputRef}
            type="file"
            accept="image/*"
            onChange={handleClothingImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Try On Button */}
      <motion.button
        onClick={handleTryOn}
        disabled={disabled || isProcessing || !personImage || !clothingImage}
        className={`w-full py-3 rounded-lg font-medium transition-all ${
          disabled || isProcessing || !personImage || !clothingImage
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
        }`}
        whileHover={{ scale: disabled || isProcessing || !personImage || !clothingImage ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isProcessing || !personImage || !clothingImage ? 1 : 0.98 }}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
            <span>Đang xử lý...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            <span>Thử đồ ảo</span>
          </div>
        )}
      </motion.button>

      {/* Result */}
      {result && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
          <Image
            src={result.resultImageUrl}
            alt="Try-on result"
            fill
            className="object-cover"
          />
        </div>
      )}
    </div>
  )
}
