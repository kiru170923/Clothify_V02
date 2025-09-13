'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  resultImage: string
  personImage: string
  clothingImage: string
  onTryAgain: () => void
}

export default function ResultModal({ 
  isOpen, 
  onClose, 
  resultImage, 
  personImage, 
  clothingImage,
  onTryAgain
}: ResultModalProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const downloadImage = async () => {
    try {
      const response = await fetch(resultImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `clothify-result-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Đã tải xuống ảnh!')
    } catch (error) {
      toast.error('Không thể tải xuống ảnh')
    }
  }

  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ảnh thử đồ từ Clothify',
          text: 'Xem ảnh thử đồ AI tuyệt vời này!',
          url: window.location.href
        })
      } catch (error) {
        console.log('Share failed:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Đã sao chép link!')
      } catch (error) {
        toast.error('Không thể chia sẻ')
      }
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-md w-full max-h-[70vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">🎉 Kết quả</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 overflow-y-auto">
            <div className="grid grid-cols-4 gap-3">
              {/* Original Images */}
              <div className="col-span-1">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group">
                  <img
                    src={personImage}
                    alt="Ảnh gốc"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onClick={() => setZoomedImage(personImage)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <MagnifyingGlassIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <p className="text-xs font-medium text-gray-900">Gốc</p>
                </div>
              </div>

              <div className="col-span-1">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group">
                  <img
                    src={clothingImage}
                    alt="Trang phục"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onClick={() => setZoomedImage(clothingImage)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <MagnifyingGlassIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <p className="text-xs font-medium text-gray-900">Đồ</p>
                </div>
              </div>

              {/* Result Image - Takes 2 columns and is 2x bigger */}
              <div className="col-span-2">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group">
                  <img
                    src={resultImage}
                    alt="Kết quả thử đồ"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onClick={() => setZoomedImage(resultImage)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <MagnifyingGlassIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <p className="text-sm font-medium text-gray-900">Kết quả AI</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 mt-3 pt-2 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadImage}
                className="btn btn-primary btn-sm flex items-center gap-1 flex-1 text-xs"
              >
                <ArrowDownTrayIcon className="w-3 h-3" />
                Tải
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={shareImage}
                className="btn btn-secondary btn-sm flex items-center gap-1 flex-1 text-xs"
              >
                <ShareIcon className="w-3 h-3" />
                Chia sẻ
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onTryAgain}
                className="btn btn-ghost btn-sm flex items-center gap-1 flex-1 text-xs"
              >
                <ArrowPathIcon className="w-3 h-3" />
                Lại
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Zoomed Image Modal - Outside main modal */}
      {zoomedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            src={zoomedImage}
            alt="Phóng to"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
