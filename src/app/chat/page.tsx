'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, User, MessageCircle, Heart, Sparkles, TrendingUp, Coffee, ShoppingBag, Camera, Palette } from 'lucide-react'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import toast from 'react-hot-toast'
import { ImageSkeleton, LoadingText } from '../../components/SkeletonLoader'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  typing?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '✨ **Chào bạn! Tôi là AI Stylist của Clothify** ✨\n\nTôi có thể giúp bạn:\n\n🎯 **Tư vấn outfit** cho mọi dịp đặc biệt\n🎨 **Phối màu** và kết hợp phụ kiện\n👗 **Chọn trang phục** phù hợp với dáng người\n✨ **Xu hướng thời trang** mới nhất 2024\n📸 **Hướng dẫn thử đồ** với AI\n\n💡 *Hãy kể cho tôi về phong cách bạn thích hoặc dịp bạn cần tư vấn!*',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      content: '',
      isUser: false,
      timestamp: new Date(),
      typing: true
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: messages.slice(-5) // Send last 5 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Remove typing indicator and add real response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'typing')
        return [...filtered, {
          id: Date.now().toString(),
          content: data.response,
          isUser: false,
          timestamp: new Date()
        }]
      })

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'typing')
        return [...filtered, {
          id: Date.now().toString(),
          content: '⚠️ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
          isUser: false,
          timestamp: new Date()
        }]
      })
      toast.error('Có lỗi xảy ra khi gửi tin nhắn')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleMicClick = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'vi-VN'

      recognition.onstart = () => {
        setIsRecording(true)
        toast.success('🎤 Đang nghe... Hãy nói gì đó!')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        toast.success('✅ Đã ghi nhận: ' + transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        toast.error('❌ Lỗi nhận diện giọng nói')
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } else {
      toast.error('❌ Trình duyệt không hỗ trợ nhận diện giọng nói')
    }
  }

  const quickSuggestions = [
    "🌟 Tư vấn outfit cho buổi hẹn hò",
    "💼 Cách phối đồ công sở chuyên nghiệp", 
    "🔥 Xu hướng thời trang hot nhất 2024",
    "🎨 Màu sắc phù hợp với tone da của tôi",
    "☀️ Outfit mát mẻ cho mùa hè",
    "💎 Phụ kiện thời trang must-have",
    "👗 Chọn váy phù hợp với dáng người",
    "📸 Hướng dẫn sử dụng AI thử đồ"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 flex flex-col h-screen">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-6 shadow-xl">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Fashion Stylist</h1>
                <p className="text-purple-100">Trợ lý thời trang cá nhân của bạn ✨</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-2 text-white/90">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-sm font-medium">Online</span>
                </div>
                
                {/* Quick Action Buttons */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open('/try-on', '_blank')}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-sm border border-white/20"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">Thử đồ</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open('/wardrobe', '_blank')}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-sm border border-white/20"
                >
                  <Palette className="w-4 h-4" />
                  <span className="text-sm font-medium">Tủ đồ</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-4 max-w-3xl ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                      message.isUser 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-500'
                    }`}>
                      {message.isUser ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`px-6 py-4 rounded-2xl shadow-lg max-w-full ${
                      message.isUser 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                        : 'bg-white border border-purple-100 text-gray-900'
                    }`}>
                      {message.typing ? (
                        <div className="flex space-x-2">
                          <LoadingText text="AI đang suy nghĩ" className="text-purple-600" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                      )}
                      <div className={`text-xs mt-3 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">💡 Gợi ý câu hỏi:</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setInputMessage(suggestion)}
                    className="p-4 bg-gradient-to-br from-white to-purple-50 border border-purple-100 rounded-xl text-left text-gray-700 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-200 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100 px-6 py-4">
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Hỏi tôi về thời trang, phong cách, hoặc bất kỳ điều gì bạn muốn..."
                  rows={1}
                  className="w-full px-6 py-4 border-2 border-purple-100 focus:border-purple-300 rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-purple-100 text-gray-900 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  style={{ minHeight: '56px', maxHeight: '120px' }}
                />
              </div>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleMicClick}
                disabled={isRecording || isLoading}
                className={`p-4 rounded-2xl transition-all duration-200 shadow-lg ${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-red-200' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
                }`}
              >
                <Mic className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
