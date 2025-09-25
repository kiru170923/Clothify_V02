'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  resultImage: string | null
  personImage: string | null
  clothingImage: string | null
  clothingItems?: Array<{
    id: string
    image: string
    type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
    label: string
    category?: string
    color?: string
    style?: string
    confidence?: number
  }>
  onTryAgain?: () => void
  onZoom?: (image: string) => void
}

export default function ResultModal({ 
  isOpen, 
  onClose, 
  resultImage, 
  personImage, 
  clothingImage,
  clothingItems,
  onTryAgain,
  onZoom
}: ResultModalProps) {
  const downloadImage = async () => {
    if (!resultImage) {
      toast.error('Không có ảnh để tải xuống')
      return
    }
    
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(resultImage)}`
      const response = await fetch(proxyUrl, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
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
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                     onClick={() => {
                       if (personImage) {
                         console.log('Person image clicked, calling onZoom')
                         onZoom?.(personImage)
                       }
                     }}>
                  {personImage ? (
                    <img
                      src={personImage}
                      alt="Ảnh gốc"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Không có ảnh</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="text-center mt-1">
                  <p className="text-xs font-medium text-gray-900">Gốc</p>
                </div>
              </div>

              <div className="col-span-1">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group">
                  {clothingItems && clothingItems.length > 0 ? (
                    <div className="w-full h-full relative">
                      {/* Show first clothing item as main */}
                      <img
                        src={clothingItems[0].image}
                        alt="Trang phục"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onClick={() => onZoom?.(clothingItems[0].image)}
                      />
                      
                      {/* Show count badge if multiple items */}
                      {clothingItems.length > 1 && (
                        <div className="absolute top-1 right-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                          +{clothingItems.length - 1}
                        </div>
                      )}
                      
                      {/* Hover overlay to show all items */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center pointer-events-none">
                        <MagnifyingGlassIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : clothingImage ? (
                    <div className="w-full h-full relative">
                      <img
                        src={clothingImage}
                        alt="Trang phục"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onClick={() => onZoom?.(clothingImage)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center pointer-events-none">
                        <MagnifyingGlassIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Không có ảnh</span>
                    </div>
                  )}
                </div>
                <div className="text-center mt-1">
                  <p className="text-xs font-medium text-gray-900">
                    Đồ {clothingItems && clothingItems.length > 1 ? `(${clothingItems.length})` : ''}
                  </p>
                </div>
              </div>

              {/* Result Image - Takes 2 columns and is 2x bigger */}
              <div className="col-span-2">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                     onClick={() => {
                       if (resultImage) {
                         console.log('Result image clicked, calling onZoom')
                         onZoom?.(resultImage)
                       }
                     }}>
                  {resultImage ? (
                    <img
                      src={resultImage}
                      alt="Kết quả thử đồ"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Không có kết quả</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center pointer-events-none">
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

    </AnimatePresence>
  )
}
