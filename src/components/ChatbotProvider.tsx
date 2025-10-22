'use client'

import { createContext, useContext, useState, ReactNode, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import StickyLogo from './StickyLogo'

const FashionChatbot = dynamic(() => import('./FashionChatbot'), {
  loading: () => <div className="w-full h-full flex items-center justify-center">Đang tải...</div>,
  ssr: false,
})

interface ChatbotContextType {
  isOpen: boolean
  openChatbot: () => void
  closeChatbot: () => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider')
  }
  return context
}

interface ChatbotProviderProps {
  children: ReactNode
}

export default function ChatbotProvider({ children }: ChatbotProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const openChatbot = () => setIsOpen(true)
  const closeChatbot = () => setIsOpen(false)

  // Hide chatbot on admin page
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname === '/admin'

  return (
    <ChatbotContext.Provider value={{ isOpen, openChatbot, closeChatbot }}>
      {children}
      
      {/* Sticky Logo - hiển thị ở mọi trang trừ admin */}
      {!isAdminPage && <StickyLogo onClick={openChatbot} />}
      
      {/* Chatbot Popup */}
      {isOpen && !isAdminPage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex p-0">
          <div className="bg-white w-screen h-screen rounded-none shadow-none flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">AI Fashion Advisor</h2>
              <button
                onClick={closeChatbot}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Đóng chatbot"
                title="Đóng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Đang tải...</div>}>
                <FashionChatbot />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </ChatbotContext.Provider>
  )
}
