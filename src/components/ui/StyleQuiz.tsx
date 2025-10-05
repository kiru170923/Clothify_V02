'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  SparklesIcon,
  StarIcon,
  LightBulbIcon,
  ChartBarIcon,
  HeartIcon,
  ShoppingBagIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useStyleQuiz } from '@/lib/styleQuiz'

interface StyleQuizProps {
  onComplete?: (result: any) => void
  onClose?: () => void
  disabled?: boolean
}

export default function StyleQuiz({ 
  onComplete, 
  onClose,
  disabled = false 
}: StyleQuizProps) {
  const [isStarted, setIsStarted] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null)
  
  const {
    startQuiz,
    getCurrentQuestion,
    answerQuestion,
    getProgress,
    isCompleted,
    getResult,
    resetQuiz
  } = useStyleQuiz()

  const currentQuestion = getCurrentQuestion()
  const progress = getProgress()
  const completed = isCompleted()
  const result = getResult()

  useEffect(() => {
    if (completed && result && !showResult) {
      setShowResult(true)
      fetchRecommendedProducts(result)
      // Don't call onComplete immediately - let user see the result first
    }
  }, [completed, result, showResult])

  const fetchRecommendedProducts = async (quizResult: any) => {
    setIsLoadingProducts(true)
    try {
      const response = await fetch('/api/style-quiz/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizResult }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.products && data.products.length > 0) {
          setRecommendedProducts(data.products)
        } else {
          console.log('No products found:', data.message)
          setRecommendedProducts([])
        }
      } else {
        console.error('Failed to fetch recommended products')
        setRecommendedProducts([])
      }
    } catch (error) {
      console.error('Error fetching recommended products:', error)
      setRecommendedProducts([])
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleStart = () => {
    startQuiz()
    setIsStarted(true)
  }

  const handleAnswer = (answerId: string) => {
    if (!currentQuestion) return

    // Check if this option allows custom input
    const option = currentQuestion.options.find(opt => opt.id === answerId)
    if (option?.allowCustom) {
      setShowCustomInput(answerId)
      return
    }

    let newSelectedAnswers: string[] = []

    if (currentQuestion.type === 'single') {
      newSelectedAnswers = [answerId]
    } else if (currentQuestion.type === 'multiple') {
      if (selectedAnswers.includes(answerId)) {
        newSelectedAnswers = selectedAnswers.filter(id => id !== answerId)
      } else {
        newSelectedAnswers = [...selectedAnswers, answerId]
      }
    } else if (currentQuestion.type === 'scale') {
      newSelectedAnswers = [answerId]
    }

    setSelectedAnswers(newSelectedAnswers)
  }

  const handleCustomInput = (answerId: string, customValue: string) => {
    if (!customValue.trim()) return

    setCustomInputs(prev => ({
      ...prev,
      [answerId]: customValue
    }))

    // Add custom answer to selected answers
    let newSelectedAnswers: string[] = []
    if (currentQuestion?.type === 'single') {
      newSelectedAnswers = [answerId]
    } else if (currentQuestion?.type === 'multiple') {
      newSelectedAnswers = [...selectedAnswers, answerId]
    }

    setSelectedAnswers(newSelectedAnswers)
    setShowCustomInput(null)
  }

  const handleNext = () => {
    if (!currentQuestion || selectedAnswers.length === 0) return

    // Prepare answers with custom values
    const answersWithCustom = selectedAnswers.map(answerId => {
      const customValue = customInputs[answerId]
      return customValue ? customValue : answerId
    })

    const success = answerQuestion(currentQuestion.id, selectedAnswers, answersWithCustom)
    if (success) {
      setSelectedAnswers([])
      setCustomInputs({})
      setShowCustomInput(null)
    }
  }

  const handlePrevious = () => {
    // In a real implementation, you would need to implement previous question functionality
    console.log('Previous question')
  }

  const handleRestart = () => {
    resetQuiz()
    setIsStarted(false)
    setSelectedAnswers([])
    setShowResult(false)
  }

  if (showResult && result) {
    return (
      <div className="space-y-6">
        {/* Result Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <SparklesIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Kết quả trắc nghiệm phong cách
          </h2>
          <p className="text-gray-600">
            Độ tin cậy: {Math.round(result.confidence * 100)}%
          </p>
        </div>

        {/* Style Personality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Phong cách của bạn: {result.stylePersonality}
          </h3>
          <div className="space-y-2">
            {result.styleTraits.map((trait, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">{trait.trait}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`w-3 h-3 ${
                            star <= Math.round(trait.score * 5) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{trait.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recommended Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5 text-green-500" />
            Sản phẩm phù hợp với bạn
          </h3>
          
          {isLoadingProducts ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Đang tìm sản phẩm phù hợp...</p>
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedProducts.slice(0, 6).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow group"
                >
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title || 'Sản phẩm'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBagIcon className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Confidence Badge */}
                    <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      {Math.round((product.confidence || 0.5) * 100)}%
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800 truncate" title={product.title}>
                      {product.title}
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-600">
                        {product.price ? `${product.price.toLocaleString()}đ` : 'Liên hệ'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>4.5</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <button className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-1">
                        <ShoppingBagIcon className="w-4 h-4" />
                        Mua ngay
                      </button>
                      <button className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Chưa có sản phẩm phù hợp</p>
              <p className="text-sm mb-4">Thử làm lại trắc nghiệm để có gợi ý tốt hơn</p>
              <button
                onClick={() => {
                  setIsStarted(false)
                  setShowResult(false)
                  setRecommendedProducts([])
                  setSelectedAnswers([])
                  setCustomInputs({})
                  setShowCustomInput(null)
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Làm lại trắc nghiệm
              </button>
            </div>
          )}
        </motion.div>

        {/* General Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
            Gợi ý phong cách
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">{rec.category}</h4>
                <p className="text-sm text-gray-600 mb-2">{rec.suggestion}</p>
                <p className="text-xs text-gray-500">{rec.reason}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Color Palette */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-500" />
            Bảng màu phù hợp
          </h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Màu chính</h4>
              <div className="flex gap-2">
                {result.colorPalette.primary.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: getColorValue(color) }}
                  >
                    {color === 'đen' || color === 'navy' || color === 'nâu' ? (
                      <span className="text-white">{color.charAt(0).toUpperCase()}</span>
                    ) : (
                      <span className="text-gray-800">{color.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Màu phụ</h4>
              <div className="flex gap-2">
                {result.colorPalette.secondary.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: getColorValue(color) }}
                  >
                    {color === 'đen' || color === 'navy' || color === 'nâu' ? (
                      <span className="text-white">{color.charAt(0).toUpperCase()}</span>
                    ) : (
                      <span className="text-gray-800">{color.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Brand Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-red-500" />
            Thương hiệu phù hợp
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.brandSuggestions.map((brand, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{brand.brand}</h4>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(brand.affinity * 5) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{brand.reason}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-4"
        >
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Làm lại trắc nghiệm
          </button>
          <button
            onClick={() => {
              onComplete?.(result)
              onClose?.()
            }}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Xem kết quả trong chatbot
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto"
        >
          <SparklesIcon className="w-10 h-10 text-white" />
        </motion.div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Trắc nghiệm phong cách
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Khám phá phong cách thời trang phù hợp với bạn thông qua các câu hỏi đơn giản
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <CheckIcon className="w-4 h-4 text-green-500" />
            <span>12 câu hỏi ngắn gọn</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <CheckIcon className="w-4 h-4 text-green-500" />
            <span>Kết quả cá nhân hóa</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <CheckIcon className="w-4 h-4 text-green-500" />
            <span>Gợi ý trang phục phù hợp</span>
          </div>
        </div>

        <motion.button
          onClick={handleStart}
          disabled={disabled}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          Bắt đầu trắc nghiệm
        </motion.button>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Đang tải câu hỏi...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Câu {progress.current} / {progress.total}</span>
          <span>{progress.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <div key={option.id}>
              <motion.button
                onClick={() => handleAnswer(option.id)}
                disabled={disabled}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswers.includes(option.id)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                whileHover={{ scale: disabled ? 1 : 1.02 }}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
              >
                <div className="flex items-center gap-3">
                  {currentQuestion.type === 'multiple' && (
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedAnswers.includes(option.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers.includes(option.id) && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                  )}
                  {currentQuestion.type === 'single' && (
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswers.includes(option.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers.includes(option.id) && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  )}
                  {currentQuestion.type === 'scale' && (
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswers.includes(option.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers.includes(option.id) && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  )}
                  <span className="flex-1">{option.text}</span>
                </div>
              </motion.button>

              {/* Custom Input */}
              {showCustomInput === option.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 bg-gray-50 rounded-lg"
                >
                  <input
                    type="text"
                    placeholder="Nhập chi tiết..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomInput(option.id, e.currentTarget.value)
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Nhập chi tiết..."]') as HTMLInputElement
                        if (input?.value) {
                          handleCustomInput(option.id, input.value)
                        }
                      }}
                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600"
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => setShowCustomInput(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                    >
                      Hủy
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Show custom value if already entered */}
              {customInputs[option.id] && (
                <div className="mt-2 p-2 bg-purple-100 text-purple-800 text-sm rounded-md">
                  <strong>Đã nhập:</strong> {customInputs[option.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={progress.current === 1 || disabled}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Trước</span>
        </button>

        <button
          onClick={handleNext}
          disabled={selectedAnswers.length === 0 || disabled}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
        >
          <span>{progress.current === progress.total ? 'Hoàn thành' : 'Tiếp theo'}</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Helper function to get color values
function getColorValue(color: string): string {
  const colorMap: Record<string, string> = {
    'đen': '#000000',
    'trắng': '#FFFFFF',
    'xám': '#808080',
    'navy': '#000080',
    'nâu': '#8B4513',
    'beige': '#F5F5DC',
    'xanh dương': '#0000FF',
    'xanh lá': '#008000',
    'đỏ': '#FF0000',
    'vàng': '#FFFF00',
    'hồng': '#FFC0CB',
    'tím': '#800080',
    'cam': '#FFA500'
  }
  
  return colorMap[color] || '#808080'
}
