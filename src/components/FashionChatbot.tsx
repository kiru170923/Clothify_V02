'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  LinkIcon,
  StarIcon,
  ShoppingBagIcon,
  HeartIcon,
  ShareIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  product?: ProductData
  image?: string
}

interface ProductData {
  name: string
  price: string
  originalPrice?: string
  discount?: string
  rating: number
  reviewCount: string
  sold: string
  description: string
  images: string[]
  brand?: string
  category?: string
  productUrl?: string
}

interface FashionAdvice {
  style: string
  pairing: string
  quality: string
  improvement: string
  trend: string
}

export default function FashionChatbot() {
  const router = useRouter()
  
  // Load messages from localStorage on component mount
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('fashion-chatbot-messages')
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages)
          // Convert timestamp strings back to Date objects
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        } catch (error) {
          console.error('Error parsing saved messages:', error)
        }
      }
    }
    return [
      {
        id: '1',
        type: 'bot',
        content: '👋 Chào bạn! Tôi là AI Fashion Advisor. Hãy gửi link sản phẩm Shopee để tôi phân tích và tư vấn thời trang cho bạn nhé!',
        timestamp: new Date()
      }
    ]
  })
  
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleTryOn = (imageUrl: string) => {
    if (!imageUrl) {
      toast.error('Không có ảnh sản phẩm để thử đồ')
      return
    }
    
    // Encode image URL and navigate to try-on page
    const encodedImageUrl = encodeURIComponent(imageUrl)
    router.push(`/try-on?clothing=${encodedImageUrl}`)
    toast.success('Chuyển đến trang thử đồ ảo...')
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.')
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ.')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Clean up any existing object URLs
    messages.forEach(message => {
      if (message.image && message.image.startsWith('blob:')) {
        URL.revokeObjectURL(message.image)
      }
    })
  }

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fashion-chatbot-messages', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Function to clear conversation
  const clearConversation = () => {
    const initialMessage: Message = {
      id: '1',
      type: 'bot',
      content: '👋 Chào bạn! Tôi là AI Fashion Advisor. Hãy gửi link sản phẩm Shopee để tôi phân tích và tư vấn thời trang cho bạn nhé!',
      timestamp: new Date()
    }
    setMessages([initialMessage])
    toast.success('Đã xóa hội thoại!', {
      duration: 2000,
      icon: '🗑️',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    })
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputValue.trim() && !selectedImage) || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue || 'Đã gửi ảnh để phân tích',
      timestamp: new Date(),
      image: selectedImage ? URL.createObjectURL(selectedImage) : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Check if user sent an image
      if (selectedImage) {
        console.log('🔍 Analyzing uploaded image:', selectedImage.name, selectedImage.size, 'bytes')
        
        const formData = new FormData()
        formData.append('image', selectedImage)
        formData.append('message', inputValue || 'Phân tích trang phục và đưa ra gợi ý')
        
        console.log('🔍 Sending FormData to /api/chat...')
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData
        })
        
        console.log('🔍 Response status:', response.status)
        console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Response not ok:', response.status, errorText)
          throw new Error(`Server error: ${response.status} - ${errorText}`)
        }
        
        const contentType = response.headers.get('content-type')
        console.log('🔍 Content type:', contentType)
        
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text()
          console.error('❌ Non-JSON response:', responseText)
          throw new Error(`Server trả về response không đúng format: ${responseText.substring(0, 200)}...`)
        }
        
        const data = await response.json()
        console.log('✅ Image analysis response:', data)
        
        if (!data.success) {
          throw new Error(data.error || 'Không thể phân tích ảnh')
        }
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.response || 'Xin lỗi, tôi không thể phân tích ảnh này.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
        toast.success('Phân tích ảnh thành công!')
        
        // Clear image after sending
        removeImage()
        
      } else if (inputValue.includes('shopee.vn') || inputValue.includes('shopee.com')) {
        console.log('Analyzing Shopee product:', inputValue)
        
        const response = await fetch('/api/shopee/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: inputValue })
        })

        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text()
          console.error('Non-JSON response:', responseText)
          throw new Error(`Server trả về response không đúng format: ${responseText.substring(0, 100)}...`)
        }

        const data = await response.json()
        console.log('API response:', data)

        if (data.success && data.product) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: data.advice || 'Tôi đã phân tích sản phẩm này! Đây là thông tin chi tiết và lời khuyên thời trang:',
            timestamp: new Date(),
            product: data.product
          }
          setMessages(prev => [...prev, botMessage])
          toast.success('Phân tích sản phẩm thành công!')
        } else {
          throw new Error(data.error || 'Không thể phân tích sản phẩm')
        }
      } else {
        // Regular chat response with context
        console.log('Sending chat message with context:', inputValue)
        
        // Prepare conversation context (last 10 messages to optimize tokens)
        const recentMessages = messages.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: inputValue,
            context: recentMessages
          })
        })

        const data = await response.json()
        console.log('Chat response:', data)
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.response || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      toast.error(errorMessage)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `❌ **Lỗi**: ${errorMessage}\n\n💡 **Gợi ý**:\n- Kiểm tra lại link Shopee có đúng không\n- Thử lại sau vài giây\n- Liên hệ support nếu vấn đề tiếp tục`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: string) => {
    return price.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarSolidIcon 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
      />
    ))
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto relative">
      {/* Sticky Clear Conversation Button */}
      {messages.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearConversation}
          className="fixed top-16 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
          title="Xóa hội thoại"
        >
          <TrashIcon className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Xóa hội thoại</span>
        </motion.button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Fashion Advisor</h2>
            <p className="text-sm text-gray-600">Tư vấn thời trang thông minh</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* User uploaded image */}
                  {message.image && (
                    <div className="mt-3">
                      <img
                        src={message.image}
                        alt="Uploaded image"
                        className="max-w-full h-auto rounded-lg border border-white/20"
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>

                {/* Product Card */}
                {message.product && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    {/* Product Images */}
                    <div className="relative">
                      {console.log('🔍 Frontend - Product images:', message.product.images)}
                      <div className="flex overflow-x-auto gap-2 p-3">
                        {message.product.images?.slice(0, 3).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        ))}
                      </div>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2">
                        <HeartIcon className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {message.product.name}
                        </h3>
                        <button className="ml-2 p-1 hover:bg-gray-100 rounded-full">
                          <ShareIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-red-500">
                          {formatPrice(message.product.price)}
                        </span>
                        {message.product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(message.product.originalPrice)}
                          </span>
                        )}
                        {message.product.discount && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            -{message.product.discount}
                          </span>
                        )}
                      </div>

                      {/* Rating & Stats */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          {renderStars(message.product.rating)}
                          <span className="ml-1">{message.product.rating}</span>
                        </div>
                        <span>{message.product.reviewCount} đánh giá</span>
                        <span>{message.product.sold} đã bán</span>
                      </div>

                      {/* Brand & Category */}
                      {(message.product.brand || message.product.category) && (
                        <div className="flex gap-2 mb-3">
                          {message.product.brand && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              {message.product.brand}
                            </span>
                          )}
                          {message.product.category && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {message.product.category}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {message.product.description && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                          {message.product.description}
                        </p>
                      )}

                      {/* Action Buttons */}
                       <div className="flex gap-2">
                         <button 
                           onClick={() => handleTryOn(message.product?.images?.[0] || '')}
                           className="flex-1 bg-black hover:bg-gray-800 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-all"
                         >
                           <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                           Thử đồ ảo
                         </button>
                         <button 
                           onClick={() => {
                             if (message.product?.productUrl) {
                               window.open(message.product.productUrl, '_blank')
                             }
                           }}
                           className="flex-1 bg-black hover:bg-gray-800 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-all"
                         >
                           <ShoppingBagIcon className="w-3 h-3 inline mr-1" />
                           Mua ngay
                         </button>
                         <button className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs transition-all">
                           <LinkIcon className="w-3 h-3" />
                         </button>
                       </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm text-gray-600">
                  {inputValue.includes('shopee') ? 'Đang phân tích sản phẩm Shopee...' : 'AI đang suy nghĩ...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{selectedImage?.name}</p>
                <p className="text-xs text-gray-500">{(selectedImage?.size || 0 / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button
                onClick={removeImage}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập link sản phẩm Shopee, câu hỏi về thời trang hoặc upload ảnh..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {inputValue.includes('shopee') && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <LinkIcon className="w-5 h-5 text-green-500" />
              </div>
            )}
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-500 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
           <button
             type="submit"
             disabled={(!inputValue.trim() && !selectedImage) || isLoading}
             className="px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
           >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>

        {/* Example Links */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Thử với link Shopee này:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setInputValue('https://shopee.vn/product/123456789')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Ví dụ link Shopee
            </button>
            <span className="text-xs text-gray-400">•</span>
            <button
              onClick={() => setInputValue('Tôi nên mặc gì cho buổi hẹn hò?')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Tư vấn phối đồ
            </button>
            <span className="text-xs text-gray-400">•</span>
            <button
              onClick={() => setInputValue('Xu hướng thời trang mùa hè 2024')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Xu hướng thời trang
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
