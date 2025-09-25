'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, FolderOpenIcon, ComputerDesktopIcon, CameraIcon } from '@heroicons/react/24/outline'
import React, { useRef } from 'react'
import { toast } from 'react-hot-toast'

interface GarmentSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectFromDevice: (file: File) => void
  onSelectFromWardrobe?: () => void
  onSelectFromCamera?: () => void
  title?: string
  showWardrobe?: boolean
}

export default function GarmentSelectionModal({
  isOpen,
  onClose,
  onSelectFromDevice,
  onSelectFromWardrobe,
  onSelectFromCamera,
  title = 'Select Garment',
  showWardrobe = true,
}: GarmentSelectionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onSelectFromDevice(file)
      onClose()
    } else {
      toast.error('Please select an image file.')
    }
  }

  const handleSelectWardrobe = () => {
    if (onSelectFromWardrobe) {
      onSelectFromWardrobe()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-amber-50 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-amber-200"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>

              <div className="space-y-4">
                {/* Chụp ảnh bằng Camera */}
                <button
                  onClick={() => {
                    onSelectFromCamera?.()
                    onClose()
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-amber-100 shadow-sm hover:border-amber-300 transition-all"
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <CameraIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Capture with Camera</span>
                </button>

                {/* Chọn từ Tủ đồ */}
                {showWardrobe && onSelectFromWardrobe && (
                  <button
                    onClick={handleSelectWardrobe}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-amber-100 shadow-sm hover:border-amber-300 transition-all"
                  >
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <FolderOpenIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <span className="font-semibold text-gray-900">Choose from Wardrobe</span>
                  </button>
                )}

                {/* Chọn từ Máy */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-amber-100 shadow-sm hover:border-amber-300 transition-all"
                >
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <ComputerDesktopIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Choose from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
