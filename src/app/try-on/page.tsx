'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrashIcon } from '@heroicons/react/24/outline'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import UploadCard from '../../components/UploadCard'
import TryOnButton from '../../components/TryOnButtonNew'
import ResultModal from '../../components/ResultModal'
import toast from 'react-hot-toast'

export default function TryOnPage() {
  const [personImage, setPersonImage] = useState<string | null>(null)
  const [clothingImage, setClothingImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  const handleTryOnResult = (imageUrl: string) => {
    setResultImage(imageUrl)
    setShowResultModal(true)
  }

  const handleClearImages = () => {
    setPersonImage(null)
    setClothingImage(null)
    setResultImage(null)
    setShowResultModal(false)
    toast.success('Đã xóa tất cả ảnh')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Thử Đồ với AI
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload ảnh của bạn và ảnh trang phục muốn thử, để AI tạo ra hình ảnh bạn mặc trang phục đó
              </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-4 mb-6">
                <UploadCard
                  label="Ảnh cá nhân"
                  image={personImage}
                  onChange={setPersonImage}
                  type="person"
                  onZoom={setZoomedImage}
                />
                <UploadCard
                  label="Trang phục"
                  image={clothingImage}
                  onChange={setClothingImage}
                  type="clothing"
                  onZoom={setZoomedImage}
                />
              </div>

              {/* Clear Images Button */}
              {(personImage || clothingImage) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearImages}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors mx-auto mb-6"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Xóa tất cả ảnh</span>
                </motion.button>
              )}

              {/* Try On Button */}
              <div className="flex justify-center">
                <TryOnButton
                  personImage={personImage}
                  clothingImage={clothingImage}
                  onResult={handleTryOnResult}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Hướng dẫn sử dụng:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Upload ảnh cá nhân rõ nét, tốt nhất là ảnh chân dung hoặc toàn thân
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Upload ảnh trang phục bạn muốn thử, có thể là áo, quần, váy, v.v.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Nhấn "Thử đồ" và chờ AI xử lý để tạo ra kết quả
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Click vào ảnh để phóng to và xem chi tiết
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* Result Modal */}
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        personImage={personImage}
        clothingImage={clothingImage}
        resultImage={resultImage}
        onTryAgain={() => setShowResultModal(false)}
        onZoom={setZoomedImage}
      />

      {/* Global Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImage}
                alt="Zoomed"
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ 
                  maxWidth: '95vw', 
                  maxHeight: '95vh',
                  width: 'auto',
                  height: 'auto'
                }}
              />
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
