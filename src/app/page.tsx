'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon,
  PhotoIcon,
  PaperAirplaneIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { useSupabase } from '../components/SupabaseProvider'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  image?: string
  timestamp: Date
}

export default function HomePage() {
  const { user } = useSupabase()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Xin chào! Tôi là AI tư vấn phối đồ của Clothify. Hãy mô tả trang phục bạn muốn tư vấn hoặc upload ảnh để tôi có thể đánh giá và đưa ra gợi ý tốt nhất!',
      timestamp: new Date()
    }
  ])
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage) {
      toast.error('Vui lòng nhập mô tả hoặc upload ảnh')
      return
    }

    setIsGenerating(true)
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      image: uploadedImage || undefined,
      timestamp: new Date()
    }
    
    setChatHistory(prev => [...prev, userMessage])
    setPrompt('')
    setUploadedImage(null)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: uploadedImage 
          ? 'Tôi đã phân tích ảnh trang phục của bạn. Đây là một bộ trang phục rất đẹp! Tôi khuyên bạn nên phối với giày sneaker trắng và túi xách màu đen để tạo sự cân bằng. Bạn có thể thêm một chiếc khăn quàng cổ để tạo điểm nhấn.'
          : 'Dựa trên mô tả của bạn, tôi khuyên bạn nên chọn trang phục theo phong cách casual với màu sắc trung tính. Hãy thử kết hợp áo thun trắng với quần jean xanh và giày sneaker để tạo vẻ ngoài trẻ trung và năng động.',
        timestamp: new Date()
      }
      
      setChatHistory(prev => [...prev, assistantMessage])
      setIsGenerating(false)
    }, 2000)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedImage(reader.result as string)
      toast.success('Đã upload ảnh thành công!')
    }
    reader.readAsDataURL(file)
  }

  const examplePrompts = [
    'Tôi nên mặc gì cho buổi hẹn hò đầu tiên?',
    'Phối đồ cho công sở như thế nào?',
    'Trang phục nào phù hợp với tiệc sinh nhật?',
    'Cách phối màu sắc cho mùa thu'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">Được tin tưởng bởi 10K+ người dùng</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                Powered by Advanced Clothify AI
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                AI Tư Vấn Phối Đồ
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Nhận tư vấn phối đồ thông minh từ AI! Upload ảnh trang phục hoặc mô tả phong cách bạn muốn, 
                và để Clothify AI đánh giá, gợi ý cách phối đồ hoàn hảo cho bạn.
              </p>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8">
              {/* Chat History */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {chatHistory.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                        {message.image && (
                          <div className="mb-2">
                            <img 
                              src={message.image} 
                              alt="Uploaded outfit" 
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className={`px-4 py-3 rounded-2xl ${
                          message.type === 'user' 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>

                      {message.type === 'user' && (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">AI đang phân tích...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex gap-3">
                  {/* Image Upload */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <PhotoIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </label>
                  </motion.button>

                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                      placeholder="Mô tả trang phục bạn muốn tư vấn..."
                      className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl transition-all outline-none"
                    />
                    {uploadedImage && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <img 
                          src={uploadedImage} 
                          alt="Preview" 
                          className="w-8 h-8 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span className="font-medium">Tư vấn</span>
                  </motion.button>
                </div>

                {/* Example Prompts */}
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Gợi ý:</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((example, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPrompt(example)}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-lg transition-colors"
                      >
                        {example}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl border border-gray-200 text-center"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <PhotoIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phân tích ảnh</h3>
                <p className="text-sm text-gray-600">Upload ảnh trang phục để AI phân tích và đưa ra đánh giá chi tiết</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl border border-gray-200 text-center"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <LightBulbIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gợi ý thông minh</h3>
                <p className="text-sm text-gray-600">Nhận tư vấn phối đồ phù hợp với phong cách và hoàn cảnh</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl border border-gray-200 text-center"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Tư vấn chuyên nghiệp</h3>
                <p className="text-sm text-gray-600">Được hỗ trợ bởi AI với kiến thức về thời trang và xu hướng</p>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

    </div>
  )
}