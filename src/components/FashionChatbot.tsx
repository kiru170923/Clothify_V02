'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSupabase } from './SupabaseProvider'

// Generate unique message ID
let messageIdCounter = 0
const generateMessageId = () => {
  messageIdCounter++
  return `${Date.now()}-${messageIdCounter}-${Math.random().toString(36).substr(2, 9)}`
}

// Debounce function to prevent spam
let searchTimeout: NodeJS.Timeout | null = null
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  StarIcon,
  HeartIcon,
  ShareIcon,
  TrashIcon,
  ShoppingBagIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { classifyIntent } from '../lib/nlu'
import { debounce } from '../lib/debounce'
import { parseResponseJson } from '../lib/parseResponse'

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
  const { session } = useSupabase() as any
  
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
        content: '👋 Hello! I am AI Fashion Advisor. You can ask any fashion question or upload a clothing photo for analysis and advice.',
        timestamp: new Date()
      }
    ]
  })
  
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingClarify, setPendingClarify] = useState<null | { type: 'price'|'color'|'size'|'occasion', originalQuery?: string, entities?: any }>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isSubmittingRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleTryOn = (imageUrl: string) => {
    if (!imageUrl) {
      toast.error('No product image to try on')
      return
    }
    
    // Encode image URL and navigate to try-on page
    const encodedImageUrl = encodeURIComponent(imageUrl)
    router.push(`/try-on?clothing=${encodedImageUrl}`)
    toast.success('Redirecting to virtual try-on page...')
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image too large. Please choose an image smaller than 10MB.')
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.')
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
    event.target.value = ''; // Clear the file input after selection
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Giữ lại dòng này nhưng tôi sẽ thêm một cách xử lý khác.
      try {
        const dataTransfer = new DataTransfer();
        fileInputRef.current.files = dataTransfer.files;
      } catch (e) {
        console.error("Could not reset file input using DataTransfer:", e);
      }
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

  // Persist conversation to server (debounced)
  useEffect(() => {
    const save = async () => {
      if (!session?.access_token) return
      try {
        await fetch('/api/chat/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ messages })
        })
      } catch (e) {
        console.error('Failed to save conversation:', e)
      }
    }
    const deb = debounce(save, 2000)
    deb()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, session?.access_token])

  // Keep focus on input by default
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Function to clear conversation
  const clearConversation = () => {
    const initialMessage: Message = {
      id: '1',
      type: 'bot',
      content: '👋 Hello! I am AI Fashion Advisor. You can ask any fashion question or upload a clothing photo for analysis and advice.',
      timestamp: new Date()
    }
    setMessages([initialMessage])
    toast.success('Conversation cleared!', {
      duration: 2000,
      icon: '🗑️',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    })
  }

  // Request personalized recommendations
  const requestRecommendations = async () => {
    if (!session?.access_token) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/recommend', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Recommend failed')
      const botMessage: Message = { id: generateMessageId(), type: 'bot', content: `Mình gợi ý một vài sản phẩm theo sở thích của bạn:`, timestamp: new Date() }
      setMessages(prev => [...prev, botMessage])
      for (const p of data.items || []) {
        const prod: ProductData = {
          name: p.normalized?.title || p.metadata?.title || 'Sản phẩm',
          price: p.price ? String(p.price) : (p.normalized?.price ? String(p.normalized.price) : ''),
          originalPrice: '',
          discount: '',
          rating: 4,
          reviewCount: '0',
          sold: '0',
          description: p.normalized?.description || '',
          images: p.normalized?.images || p.metadata?.images || [],
          productUrl: p.source_url
        }
        const prodMessage: Message = { id: generateMessageId(), type: 'bot', content: '', timestamp: new Date(), product: prod }
        setMessages(prev => [...prev, prodMessage])
      }
    } catch (e:any) {
      console.error('Recommend error:', e)
      toast.error('Không thể lấy gợi ý')
    } finally {
      setIsLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    
    console.log('🔍 HandleSubmit called with:', { inputValue, selectedImage, isLoading, isSubmitting: isSubmittingRef.current })
    
    if ((!inputValue.trim() && !selectedImage) || isLoading) return
    
    // Prevent double submission
    if (isLoading || isSubmittingRef.current) return
    
    isSubmittingRef.current = true
    console.log('🔍 Starting submission...')

    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: inputValue || 'Image sent for analysis',
      timestamp: new Date(),
      image: selectedImage ? URL.createObjectURL(selectedImage) : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Run NLU to detect intent for text-only messages
      if (!selectedImage && inputValue.trim()) {
        const nlu = classifyIntent(inputValue)
        if (nlu.intent === 'search') {
          // Use quick search path
          await handleQuickSearch(inputValue)
          return
        }
        if (nlu.intent === 'update_profile') {
          // fall through to existing profile update logic below
        }
      }
      // Prioritize uploaded image analysis
      if (selectedImage) {
        console.log('🔍 Analyzing uploaded image:', selectedImage.name, selectedImage.size, 'bytes')
        
        const formData = new FormData()
        formData.append('image', selectedImage)
        formData.append('message', inputValue || 'Analyze clothing and provide suggestions')
        
        console.log('🔍 Sending FormData to /api/chat...')
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout for Scrapeless
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        console.log('🔍 Response status:', response.status)
        console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()))
        
        // Read body once and validate
        const bodyText = await response.text()
        console.log('🔍 Response body (preview):', bodyText?.slice(0, 300))
        if (!response.ok) {
          console.error('❌ Response not ok:', response.status, bodyText)
          throw new Error(`Server error: ${response.status} - ${bodyText}`)
        }
        const contentType = response.headers.get('content-type')
        console.log('🔍 Content type:', contentType)
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ Non-JSON response:', bodyText)
          throw new Error(`Server returned incorrect format response: ${bodyText.substring(0, 200)}...`)
        }
        let data
        try {
          data = JSON.parse(bodyText)
        } catch (err) {
          console.error('❌ Invalid JSON response:', bodyText)
          throw new Error('Invalid JSON response from server')
        }
        console.log('✅ Image analysis response:', data)
        console.log('🔍 Response content:', data.response)
        console.log('🔍 Response type:', data.type)
        
        if (!data.success) {
          throw new Error(data.error || 'Cannot analyze image')
        }
        
        const botMessage: Message = {
          id: generateMessageId(),
          type: 'bot',
          content: data.response || 'Sorry, I cannot analyze this image.',
          timestamp: new Date()
        }
        console.log('🔍 Created bot message:', botMessage)
        setMessages(prev => [...prev, botMessage])
        toast.success('Image analysis successful!')
        
        // Clear image after sending
        removeImage()
        
      } else {
        // Regular chat response with context
        console.log('Sending chat message with context:', inputValue)

        // Quick command: update size in user_profile (e.g., "size L", "mặc size M")
        const sizeMatch = inputValue.toLowerCase().match(/size\s*(xs|s|m|l|xl)\b/)
        if (sizeMatch && session?.access_token) {
          try {
            const newSize = sizeMatch[1].toUpperCase()
        const res = await fetch('/api/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ size: newSize })
            })
            const data = await parseResponseJson(res)
            if (!res.ok) throw new Error(data.error || 'Update failed')
            const botMessage: Message = {
              id: generateMessageId(),
              type: 'bot',
              content: `✅ Đã cập nhật size của bạn thành ${newSize}.`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, botMessage])
            setIsLoading(false)
            return
          } catch (err:any) {
            const botMessage: Message = {
              id: generateMessageId(),
              type: 'bot',
              content: `❌ Không cập nhật được size: ${err.message}`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, botMessage])
            setIsLoading(false)
            return
          }
        }
        
        // Prepare conversation context (last 10 messages to optimize tokens)
        const recentMessages = messages.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout for Scrapeless
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: inputValue,
            context: recentMessages
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        console.log('🔍 Response status:', response.status)
        console.log('🔍 Response ok:', response.ok)
        
        const data = await parseResponseJson(response)
        console.log('🔍 Chat response data:', data)
        
        const botMessage: Message = {
          id: generateMessageId(),
          type: 'bot',
          content: data.response || 'Sorry, I do not understand your question.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      }
    } catch (error) {
      console.error('Error:', error)
      let errorMessage = 'An error occurred'
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - please try again'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
      
      const botMessage: Message = {
        id: generateMessageId(),
        type: 'bot',
        content: `❌ Error: ${errorMessage}\n\n💡 Suggestions:\n- Try again in a few seconds\n- Upload a clearer clothing image\n- Contact support if the problem continues`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
      // Re-focus input after sending
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  // Quick product search from chatbot UI (calls our search API)
  const handleQuickSearch = async (query: string, entities?: any) => {
    if (!query && !entities) return
    if (isLoading || isSubmittingRef.current) return // Prevent concurrent searches
    
    // Clear previous timeout
    if (searchTimeout) clearTimeout(searchTimeout)
    
    // Debounce search
    searchTimeout = setTimeout(async () => {
      isSubmittingRef.current = true
      // add user message
    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    try {
      const body: any = { q: query || '' , limit: 6 }
      if (entities) {
        if (entities.price) body.priceMin = entities.price
        if (entities.color) body.color = entities.color
        if (entities.size) body.size = entities.size
      }
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
      
      const res = await fetch('/api/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const data = await parseResponseJson(res)
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Search failed')
      }

      // Bot summary message
      const botSummary: Message = {
        id: generateMessageId(),
        type: 'bot',
        content: `Mình tìm thấy ${data.data?.length || 0} kết quả cho "${query}".`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botSummary])

      // Append each product as a bot message with product payload
      for (const p of data.data || []) {
        const prod: ProductData = {
          name: p.title || (p.normalized?.title || 'Sản phẩm'),
          price: p.price ? String(p.price) : (p.normalized?.price ? String(p.normalized.price) : ''),
          originalPrice: '',
          discount: '',
          rating: 4,
          reviewCount: '0',
          sold: '0',
          description: p.normalized?.description || '',
          images: (p.normalized?.images && p.normalized.images.length) ? p.normalized.images : (p.metadata?.images || []),
          productUrl: p.source_url
        }
        const prodMessage: Message = {
          id: generateMessageId(),
          type: 'bot',
          content: '',
          timestamp: new Date(),
          product: prod
        }
        setMessages(prev => [...prev, prodMessage])
      }
      // clear any pending clarify
      setPendingClarify(null)
    } catch (err:any) {
      console.error('Quick search error:', err)
      const botMessage: Message = { id: generateMessageId(), type: 'bot', content: `❌ Lỗi tìm kiếm: ${err.message || err}`, timestamp: new Date() }
      setMessages(prev => [...prev, botMessage])
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    }, 300) // 300ms debounce
  }

  const promptClarify = (type: 'price'|'color'|'size'|'occasion', originalQuery?: string, entities?: any) => {
    setPendingClarify({ type, originalQuery, entities })
    const botMessage: Message = { id: generateMessageId(), type: 'bot', content: type === 'price' ? 'Bạn muốn tầm giá bao nhiêu?' : type === 'color' ? 'Bạn thích màu nào?' : type === 'size' ? 'Bạn mặc size nào?' : 'Bạn dùng dịp nào?', timestamp: new Date() }
    setMessages(prev => [...prev, botMessage])
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleClarifyResponse = (value: string) => {
    if (!pendingClarify) return
    const { type, originalQuery, entities } = pendingClarify
    const merged = { ...(entities||{} ) }
    if (type === 'price') {
      // simple mapping: preset buttons like 'Dưới 300k' -> price 300000
      if (value.includes('300')) merged.price = 300000
      else if (value.includes('500')) merged.price = 500000
      else merged.price = parseInt(value.replace(/[^0-9]/g,'')) || undefined
    } else if (type === 'color') merged.color = value
    else if (type === 'size') merged.size = value

    // call search with originalQuery (if exists) otherwise empty
    handleQuickSearch(originalQuery || '', merged)
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
          title="Clear conversation"
        >
          <TrashIcon className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Clear conversation</span>
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
            <p className="text-sm text-gray-600">Smart fashion advice</p>
          </div>
        </div>
      <div className="ml-4">
        <button onClick={requestRecommendations} className="px-3 py-1 bg-amber-50 rounded text-amber-700 text-sm">Gợi ý cho tôi</button>
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
                        <span>{message.product.reviewCount} reviews</span>
                        <span>{message.product.sold} sold</span>
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
                           Virtual Try-On
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
                  {selectedImage ? 'Analyzing your image...' : 'AI is thinking...'}
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
              placeholder="Ask fashion questions or upload a clothing image for analysis..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
              ref={inputRef}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {/* Hint icon removed since Shopee link feature is disabled */}
            
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

        {/* Example prompts (Shopee removed) */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Try these prompts:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setInputValue('What should I wear for a date?')} className="text-xs text-blue-600 hover:text-blue-800 underline">Styling advice</button>
            <span className="text-xs text-gray-400">•</span>
            <button onClick={() => setInputValue('Analyze this outfit and suggest improvements')} className="text-xs text-blue-600 hover:text-blue-800 underline">Analyze outfit</button>
            <span className="text-xs text-gray-400">•</span>
            <button onClick={() => setInputValue('Latest fall fashion trends')} className="text-xs text-blue-600 hover:text-blue-800 underline">Fashion trends</button>
          </div>

          <p className="text-xs text-gray-500 mb-2">Quick product searches:</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickSearch('dưới 300k áo khoác len'); }} className="text-xs px-3 py-1 rounded bg-amber-50 text-amber-700">Dưới 300k</button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickSearch('áo khoác kem'); }} className="text-xs px-3 py-1 rounded bg-amber-50 text-amber-700">Màu kem</button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickSearch('váy đi tiệc'); }} className="text-xs px-3 py-1 rounded bg-amber-50 text-amber-700">Đi tiệc</button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickSearch('set đồ công sở'); }} className="text-xs px-3 py-1 rounded bg-amber-50 text-amber-700">Công sở</button>
          </div>
          {/* Clarify UI when pending */}
          {pendingClarify && (
            <div className="mt-2 flex flex-wrap gap-2">
              {pendingClarify.type === 'price' && (
                <>
                  <button onClick={() => handleClarifyResponse('300k')} className="text-xs px-3 py-1 rounded bg-amber-50">Dưới 300k</button>
                  <button onClick={() => handleClarifyResponse('300-500k')} className="text-xs px-3 py-1 rounded bg-amber-50">300k-500k</button>
                  <button onClick={() => handleClarifyResponse('500k')} className="text-xs px-3 py-1 rounded bg-amber-50">Trên 500k</button>
                </>
              )}
              {pendingClarify.type === 'color' && (
                <>
                  <button onClick={() => handleClarifyResponse('kem')} className="text-xs px-3 py-1 rounded bg-amber-50">Kem</button>
                  <button onClick={() => handleClarifyResponse('hồng')} className="text-xs px-3 py-1 rounded bg-amber-50">Hồng</button>
                  <button onClick={() => handleClarifyResponse('đen')} className="text-xs px-3 py-1 rounded bg-amber-50">Đen</button>
                </>
              )}
              {pendingClarify.type === 'size' && (
                <>
                  <button onClick={() => handleClarifyResponse('S')} className="text-xs px-3 py-1 rounded bg-amber-50">S</button>
                  <button onClick={() => handleClarifyResponse('M')} className="text-xs px-3 py-1 rounded bg-amber-50">M</button>
                  <button onClick={() => handleClarifyResponse('L')} className="text-xs px-3 py-1 rounded bg-amber-50">L</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
