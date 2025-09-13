'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon, ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useSupabase } from '../components/SupabaseProvider'
import UploadCard from '../components/UploadCard'
import Header from '../components/Header'
import TryOnButton from '../components/TryOnButton'
import Sidebar from '../components/Sidebar'
import { WardrobeTab } from '../components/WardrobeTab'
import { ProfileTab } from '../components/ProfileTab'
import { HistoryTab } from '../components/HistoryTab'
import { SettingsTab } from '../components/SettingsTab'
import Toast from '../components/Toast'
import ResultModal from '../components/ResultModal'

export default function HomePage() {
  const { user, loading, signIn } = useSupabase()
  const [personImage, setPersonImage] = useState<string | null>(null)
  const [clothingImage, setClothingImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  const handleTryOnResult = (imageUrl: string) => {
    setResultImage(imageUrl)
    setShowResultModal(true)
  }

  const handleTryAgain = () => {
    setShowResultModal(false)
    setResultImage(null)
    // Optionally clear the images to start fresh
    // setPersonImage(null)
    // setClothingImage(null)
  }

  const handleClearImages = () => {
    setPersonImage(null)
    setClothingImage(null)
    setResultImage(null)
    setShowResultModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="loading-dots text-gray-600 text-lg"></div>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toast />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          {/* Logo */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Clothify</h1>
            <p className="text-lg text-gray-600">Thử đồ thông minh với AI</p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <SparklesIcon className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">AI Thông minh</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ArrowRightIcon className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Xử lý nhanh</p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-500 mb-6">
              Đăng nhập để trải nghiệm công nghệ thử đồ AI tiên tiến
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={signIn}
              className="btn btn-primary btn-xl w-full shadow-2xl"
            >
              <SparklesIcon className="w-5 h-5" />
              Đăng nhập với Google
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-6 py-8"
          >
            {/* Hero Section */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-medium mb-6"
              >
                <SparklesIcon className="w-4 h-4" />
                Powered by Advanced AI
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-6xl font-bold gradient-text mb-6 leading-tight"
              >
                Thử đồ trong<br />tích tắc
              </motion.h1>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
              >
                Trải nghiệm công nghệ AI tiên tiến để xem bạn trông như thế nào với trang phục mới
              </motion.p>
            </div>

            {/* Main Card */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <div className="card-interactive bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-4">
                  {/* Person Upload */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-1 lg:space-y-2"
                  >
                    <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                      <div className="w-4 h-4 lg:w-6 lg:h-6 bg-gray-900 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-xs">1</span>
                      </div>
                      <div>
                        <h3 className="text-xs lg:text-sm font-bold text-gray-900">Ảnh của bạn</h3>
                        <p className="text-xs text-gray-500 hidden lg:block">Tải lên ảnh chân dung</p>
                      </div>
                    </div>
                    <UploadCard
                      label="Tải ảnh cá nhân"
                      image={personImage}
                      onChange={setPersonImage}
                      type="person"
                    />
                  </motion.div>

                  {/* Clothing Upload */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-1 lg:space-y-2"
                  >
                    <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                      <div className="w-4 h-4 lg:w-6 lg:h-6 bg-gray-700 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-xs">2</span>
                      </div>
                      <div>
                        <h3 className="text-xs lg:text-sm font-bold text-gray-900">Trang phục</h3>
                        <p className="text-xs text-gray-500 hidden lg:block">Chọn quần áo muốn thử</p>
                      </div>
                    </div>
                    <UploadCard
                      label="Tải ảnh trang phục"
                      image={clothingImage}
                      onChange={setClothingImage}
                      type="clothing"
                    />
                  </motion.div>
                </div>

                {/* Clear Images Button */}
                {(personImage || clothingImage) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <button
                      onClick={handleClearImages}
                      className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm mx-auto"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Xóa tất cả ảnh
                    </button>
                  </motion.div>
                )}

                {/* Action Section */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12 pt-8 border-t border-gray-100"
                >
                  <TryOnButton
                    personImage={personImage}
                    clothingImage={clothingImage}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    onResult={handleTryOnResult}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Tips Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="max-w-4xl mx-auto mt-12"
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  💡 Mẹo để có kết quả tốt nhất
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📸</span>
                    </div>
                    <p className="text-sm text-gray-700">Ảnh rõ nét, ánh sáng tốt</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">👕</span>
                    </div>
                    <p className="text-sm text-gray-700">Trang phục trên nền trắng</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <p className="text-sm text-gray-700">Xử lý trong 10-30 giây</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.main>
        )
      case 'wardrobe':
        return <WardrobeTab />
      case 'profile':
        return <ProfileTab />
      case 'history':
        return <HistoryTab />
      case 'settings':
        return <SettingsTab />
      default:
        return (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Trang không tồn tại</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toast />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>
      </div>

      {/* Result Modal */}
      {resultImage && personImage && clothingImage && (
        <ResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          resultImage={resultImage}
          personImage={personImage}
          clothingImage={clothingImage}
          onTryAgain={handleTryAgain}
        />
      )}
    </div>
  )
}