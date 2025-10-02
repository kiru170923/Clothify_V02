'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'

interface StickyLogoProps {
  onClick: () => void
}

export default function StickyLogo({ onClick }: StickyLogoProps) {
  return (
    <motion.button
      initial={{ scale: 0, x: -100 }}
      animate={{ scale: 1, x: 0 }}
      whileHover={{ scale: 1.05, x: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.35)] flex items-center gap-3 px-4 py-3 cursor-pointer group hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] transition-all duration-300"
      title="AI Fashion Advisor - Nhấn để chat"
    >
      {/* Logo chính */}
      <div className="relative">
        <img 
          src="./favicon.ico.png" 
          alt="Clothify AI" 
          className="w-8 h-8 rounded-full object-cover"
        />
        
        {/* Chat icon overlay */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <MessageCircle className="w-2.5 h-2.5 text-white" />
        </motion.div>
      </div>

      {/* Text content */}
      <div className="text-white">
        <div className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="font-semibold text-sm">AI Stylist</span>
        </div>
        <div className="text-xs opacity-80">Hỏi tư vấn thời trang</div>
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Fashion Advisor
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
      </motion.div>

      {/* Pulse effect */}
      <div className="absolute inset-0 rounded-2xl bg-amber-400/20 blur-xl opacity-70" />
    </motion.button>
  )
}
