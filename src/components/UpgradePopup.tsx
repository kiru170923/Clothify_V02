'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface UpgradePopupProps {
  isOpen: boolean
  onClose: () => void
  currentTokens?: number
}

export default function UpgradePopup({ isOpen, onClose, currentTokens = 0 }: UpgradePopupProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    onClose()
    router.push('/membership')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Nâng cấp gói để có thêm tokens! 🚀
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Bạn còn <span className="font-semibold text-amber-600">{currentTokens} tokens</span>. 
                Nâng cấp gói membership để có thêm tokens và trải nghiệm AI tốt hơn!
              </p>

              {/* Features */}
              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-amber-800 mb-3">Lợi ích khi nâng cấp:</h3>
                <div className="space-y-2 text-sm text-amber-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span>Nhiều tokens hơn mỗi tháng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span>Chất lượng ảnh cao hơn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span>Hỗ trợ ưu tiên</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Để sau
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Nâng cấp ngay
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
