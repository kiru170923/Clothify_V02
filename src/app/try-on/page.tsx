'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { TrashIcon } from '@heroicons/react/24/outline'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import UploadCard from '../../components/UploadCard'
import MultipleClothingUpload from '../../components/MultipleClothingUpload'
import TryOnButton from '../../components/TryOnButtonNew'
import ResultModal from '../../components/ResultModal'
import GarmentSelectionModal from '../../components/GarmentSelectionModal'
import MiniWardrobeModal from '../../components/MiniWardrobeModal'
import toast from 'react-hot-toast'
import { useGenerateModel } from '../../hooks/useGenerateModel'
import { useMyModels } from '../../hooks/useMyModels'
import { useSupabase } from '../../components/SupabaseProvider'
import { ImageSkeleton, LoadingText, GridSkeleton } from '../../components/SkeletonLoader'
import AuthGuard from '../../components/AuthGuard'

function TryOnPageContent() {
  const searchParams = useSearchParams()
  
  // Load state from localStorage on component mount
  const [personImage, setPersonImage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('try-on-person-image')
    }
    return null
  })
  
  const [clothingImage, setClothingImage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('try-on-clothing-image')
    }
    return null
  })
  
  // New state for multiple clothing items
  const [clothingItems, setClothingItems] = useState<Array<{
    id: string
    image: string
    type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
    label: string
    category?: string
    color?: string
    style?: string
    confidence?: number
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('try-on-clothing-items')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  const [resultImage, setResultImage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('try-on-result-image')
    }
    return null
  })
  
  const [showResultModal, setShowResultModal] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [selectedGarmentType, setSelectedGarmentType] = useState<'auto' | 'top' | 'bottom' | 'full-body'>('auto')
  const [showMyModelsModal, setShowMyModelsModal] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female')
  const [showModelTooltip, setShowModelTooltip] = useState(false)
  const [showGarmentTooltip, setShowGarmentTooltip] = useState(false)
  const [showGarmentTypeTooltip, setShowGarmentTypeTooltip] = useState(false)
  const [showGarmentSelectionModal, setShowGarmentSelectionModal] = useState(false) // New state for garment selection modal
  
  // Hooks for AI model generation and management
  const { session } = useSupabase()
  const generateModelMutation = useGenerateModel()
  const { models, isLoading: isLoadingModels, uploadModel, deleteModel } = useMyModels()

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (personImage) {
        localStorage.setItem('try-on-person-image', personImage)
      } else {
        localStorage.removeItem('try-on-person-image')
      }
    }
  }, [personImage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (clothingImage) {
        localStorage.setItem('try-on-clothing-image', clothingImage)
      } else {
        localStorage.removeItem('try-on-clothing-image')
      }
    }
  }, [clothingImage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (resultImage) {
        localStorage.setItem('try-on-result-image', resultImage)
      } else {
        localStorage.removeItem('try-on-result-image')
      }
    }
  }, [resultImage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (clothingItems.length > 0) {
        localStorage.setItem('try-on-clothing-items', JSON.stringify(clothingItems))
      } else {
        localStorage.removeItem('try-on-clothing-items')
      }
    }
  }, [clothingItems])

  // Load clothing image from URL parameter
  useEffect(() => {
    const clothingParam = searchParams.get('clothing')
    if (clothingParam) {
      const decodedImageUrl = decodeURIComponent(clothingParam)
      console.log('🔍 Loading clothing image from URL:', decodedImageUrl)
      
      // Use original URL directly for KIE.AI (no proxy needed)
      setClothingImage(decodedImageUrl)
      toast.success('Đã tải ảnh sản phẩm từ chatbot!')
    }
  }, [searchParams])

  const handleTryOnResult = (imageUrl: string) => {
    setResultImage(imageUrl)
    setShowResultModal(true)
  }

  const handleClearImages = () => {
    // Optimistic update - immediate UI feedback
    setPersonImage(null)
    setClothingImage(null)
    setClothingItems([])
    setResultImage(null)
    setShowResultModal(false)
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('try-on-person-image')
      localStorage.removeItem('try-on-clothing-image')
      localStorage.removeItem('try-on-clothing-items')
      localStorage.removeItem('try-on-result-image')
    }
    
    toast.success('Đã xóa tất cả ảnh', {
      duration: 2000,
      icon: '🗑️',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    })
  }

  // Handlers for GarmentSelectionModal
  const handleSelectGarmentFromDevice = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const newItem = {
        id: Date.now().toString(),
        image: e.target?.result as string,
        type: 'top' as const,
        label: 'Garment',
        category: 'Auto detected'
      }
      setClothingItems([newItem])
    }
    reader.readAsDataURL(file)
  }

  const [showMiniWardrobeModal, setShowMiniWardrobeModal] = useState(false)

  const handleSelectGarmentFromWardrobe = () => {
    setShowMiniWardrobeModal(true)
  }

  const handleGarmentFromMiniWardrobe = (item: any) => {
    // Assuming item from wardrobe has imageUrl, category, etc.
    const newItem = {
      id: item.id,
      image: item.image_url,
      type: (item.category as any) || 'top',
      label: item.name || 'Wardrobe Garment',
      category: item.category,
      color: item.color,
      style: item.style,
      confidence: item.confidence
    }
    setClothingItems([newItem])
    setShowMiniWardrobeModal(false)
    setShowGarmentSelectionModal(false)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50" style={{ backgroundColor: '#f6f1e9' }}>
        <Header />
        
        <div className="flex">
          <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent mb-4">
                Thử Đồ với AI ✨
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload ảnh của bạn và ảnh trang phục muốn thử, để AI tạo ra hình ảnh bạn mặc trang phục đó
              </p>
            </div>

            {/* Upload Section - New Layout Like Image */}
            <div className="flex gap-6 mb-8">
              {/* Select Model Section */}
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-amber-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-gray-900">Chọn Model</h3>
                  <div className="relative">
                    <button 
                      onClick={() => setShowModelTooltip(!showModelTooltip)}
                      className="w-4 h-4 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-amber-700">?</span>
                    </button>
                    
                    {/* Modal */}
                    {showModelTooltip && (
                      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setShowModelTooltip(false)}>
                        <div className="w-[80vw] aspect-video bg-amber-50 rounded-lg overflow-hidden border border-amber-200" onClick={(e) => e.stopPropagation()}>
                          <img 
                            src="https://qriiosvdowitaigzvwfo.supabase.co/storage/v1/object/public/Linh%20Tinh/1758378024766t6sh54kr.webp"
                            alt="Model guide"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Model Image */}
                <div className="relative mb-4">
                  <div className="aspect-[2/3] bg-amber-50 rounded-lg overflow-hidden border border-amber-200">
                    {personImage ? (
                      <img
                        src={personImage}
                        alt="Model"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setZoomedImage(personImage)}
                      />
                    ) : (
                      <label 
                        htmlFor="model-upload"
                        className="w-full h-full flex items-center justify-center text-amber-500 cursor-pointer hover:text-amber-700 transition-colors"
                      >
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className="text-sm">Chưa chọn model</p>
                          <p className="text-xs mt-1 text-amber-500">Nhấp để tải lên</p>
                        </div>
                      </label>
                    )}
                  </div>
                  
                  {/* Aspect Ratio Label */}
                  {personImage && (
                    <div className="absolute bottom-2 left-2 bg-gray-800/70 text-white text-xs px-2 py-1 rounded">
                      2:3
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {personImage && (
                      <button
                        onClick={() => setZoomedImage(personImage)}
                        className="w-6 h-6 bg-white/80 hover:bg-white rounded flex items-center justify-center"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                    )}
                    {personImage && (
                      <button
                        onClick={() => setPersonImage(null)}
                        className="w-6 h-6 bg-white/80 hover:bg-white rounded flex items-center justify-center"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Model Action Buttons */}
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowPromptModal(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Tạo Model AI
                  </button>
                  <button 
                    onClick={() => setShowMyModelsModal(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    Models Của Tôi
                  </button>
                </div>
                
                {/* Hidden Upload Input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => setPersonImage(e.target?.result as string)
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="hidden"
                  id="model-upload"
                />
              </div>

              {/* Separator */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              {/* Select Garment Section */}
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-amber-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-gray-900">Chọn Trang Phục</h3>
                  <div className="relative">
                    <button 
                      onClick={() => setShowGarmentTooltip(!showGarmentTooltip)}
                      className="w-4 h-4 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-amber-700">?</span>
                    </button>
                    
                    {/* Modal */}
                    {showGarmentTooltip && (
                      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setShowGarmentTooltip(false)}>
                        <div className="w-[80vw] h-[29.8vw] bg-amber-50 rounded-lg overflow-hidden border border-amber-200" onClick={(e) => e.stopPropagation()}>
                          <img 
                            src="https://qriiosvdowitaigzvwfo.supabase.co/storage/v1/object/public/Linh%20Tinh/1758378232989j1gkwxii.webp"
                            alt="Garment guide"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Garment Upload Area */}
                <div className="aspect-[3/4] bg-amber-50 rounded-lg border-2 border-dashed border-amber-300 relative overflow-hidden mb-4">
                  {clothingItems.length > 0 ? (
                    <>
                      <img
                        src={clothingItems[0].image}
                        alt="Garment"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setZoomedImage(clothingItems[0].image)}
                      />
                      {/* Delete Button */}
                      <button
                        onClick={() => setClothingItems([])}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowGarmentSelectionModal(true)}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-amber-100 transition-colors"
                    >
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-sm text-amber-500">Chưa chọn trang phục</p>
                        <p className="text-xs mt-1 text-amber-400">Nhấp để tải lên</p>
                      </div>
                    </button>
                  )}
                </div>
                
                
                {/* Garment Type Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Loại trang phục:</span>
                    <div className="relative">
                      <button 
                        onClick={() => setShowGarmentTypeTooltip(!showGarmentTypeTooltip)}
                        className="w-4 h-4 bg-gray-300 hover:bg-gray-400 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <span className="text-xs text-gray-600">?</span>
                      </button>
                      
                      {/* Modal */}
                      {showGarmentTypeTooltip && (
                        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setShowGarmentTypeTooltip(false)}>
                          <div className="bg-amber-50 rounded-lg p-6 max-w-md border border-amber-200" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-semibold text-gray-900 mb-3">Tác dụng của từng lựa chọn</h3>
                            <div className="space-y-3 text-sm text-gray-600">
                              <div className="p-3 bg-amber-100 rounded-lg">
                                <p className="font-semibold text-amber-800">🤖 Tự động</p>
                                <p className="text-amber-700">AI tự phân tích và quyết định cách thay đổi trang phục. Phù hợp khi không chắc chắn loại trang phục.</p>
                              </div>
                              
                              <div className="p-3 bg-amber-100 rounded-lg">
                                <p className="font-semibold text-amber-800">👕 Áo</p>
                                <p className="text-amber-700">Chỉ thay đổi phần áo (tay áo, cổ áo, chất liệu). Giữ nguyên quần và phụ kiện khác. Tốt nhất khi muốn thay áo sơ mi, áo thun...</p>
                              </div>
                              
                              <div className="p-3 bg-amber-100 rounded-lg">
                                <p className="font-semibold text-amber-800">👖 Quần</p>
                                <p className="text-amber-700">Chỉ thay đổi phần quần. Giữ nguyên áo và phụ kiện. Tốt nhất khi muốn thay quần jean, quần tây...</p>
                              </div>
                              
                              <div className="p-3 bg-amber-100 rounded-lg">
                                <p className="font-semibold text-amber-800">👗 Toàn thân</p>
                                <p className="text-amber-700">Thay đổi toàn bộ trang phục (đầm, jumpsuit, bộ đồ liền). Tốt nhất cho đầm, váy liền thân...</p>
                              </div>
                              
                              <div className="p-2 bg-amber-200 rounded">
                                <p className="text-amber-900 text-xs font-medium">💡 Mẹo: Lựa chọn chính xác giúp AI tạo kết quả tốt hơn!</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <button 
                      onClick={() => setSelectedGarmentType('auto')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedGarmentType === 'auto' 
                          ? 'bg-amber-200 text-amber-800' 
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                      }`}
                    >
                      Tự động
                    </button>
                    <button 
                      onClick={() => setSelectedGarmentType('top')}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors ${
                        selectedGarmentType === 'top' 
                          ? 'bg-amber-200 text-amber-800' 
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      Áo
                    </button>
                    <button 
                      onClick={() => setSelectedGarmentType('bottom')}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors ${
                        selectedGarmentType === 'bottom' 
                          ? 'bg-amber-200 text-amber-800' 
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      Quần
                    </button>
                    <button 
                      onClick={() => setSelectedGarmentType('full-body')}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors ${
                        selectedGarmentType === 'full-body' 
                          ? 'bg-amber-200 text-amber-800' 
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      Toàn thân
                    </button>
                  </div>
                </div>
                
                {/* Hidden Upload Input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const newItem = {
                          id: Date.now().toString(),
                          image: e.target?.result as string,
                          type: 'top' as const,
                          label: 'Garment',
                          category: 'Auto detected'
                        }
                        setClothingItems([newItem])
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="hidden"
                  id="garment-upload"
                />
              </div>
              </div>

              {/* Clear Images Button */}
            {(personImage || clothingImage || clothingItems.length > 0) && (
              <div className="flex justify-center mb-8">
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearImages}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Xóa tất cả ảnh</span>
                </motion.button>
              </div>
              )}


              {/* Try On Button */}
              <div className="flex justify-center">
                <TryOnButton
                  personImage={personImage}
                clothingImage={clothingItems.length > 0 ? clothingItems[0]?.image : clothingImage}
                clothingItems={clothingItems}
                selectedGarmentType={selectedGarmentType}
                  onResult={handleTryOnResult}
                />
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
        clothingItems={clothingItems}
        resultImage={resultImage}
        onTryAgain={() => setShowResultModal(false)}
        onZoom={setZoomedImage}
      />

      {/* Prompt Modal */}
      <AnimatePresence>
        {showPromptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowPromptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPromptModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="font-semibold text-gray-900 mb-4">Generate AI Model</h3>
              
              <div className="space-y-4">
                {/* Gender Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Chọn giới tính model:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedGender('female')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedGender === 'female'
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-pink-300 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">👩</div>
                        <div className="font-medium">Nữ</div>
                        <div className="text-xs text-gray-500">Female Model</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedGender('male')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedGender === 'male'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-amber-300 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">👨</div>
                        <div className="font-medium">Nam</div>
                        <div className="text-xs text-gray-500">Male Model</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Optional Custom Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt tùy chỉnh (tùy chọn):
                  </label>
                  <textarea
                    placeholder="Ví dụ: Beautiful Asian woman, 25 years old, long black hair..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-20 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Để trống để sử dụng prompt mặc định
                  </p>
                </div>
                
                {/* Generate Button */}
                <div className="text-center">
                  <button 
                    onClick={async () => {
                      try {
                        const result = await generateModelMutation.mutateAsync({
                          gender: selectedGender,
                          customPrompt: customPrompt.trim() || undefined
                        })
                        
                        if (result.success && result.modelImageUrl) {
                          setPersonImage(result.modelImageUrl)
                          setCustomPrompt('')
                          setShowPromptModal(false)
                        }
                      } catch (error) {
                        console.error('Generate model error:', error)
                      }
                    }}
                    disabled={generateModelMutation.isPending}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-green-400 text-white rounded-lg font-medium flex items-center gap-2 mx-auto hover:from-yellow-500 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Generate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Models Modal */}
      <AnimatePresence>
        {showMyModelsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowMyModelsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowMyModelsModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4 pr-5">
                  <h3 className="font-semibold text-gray-900 text-xl">Models Của Tôi</h3>
                  <div className="text-sm text-gray-500">
                    {models?.length || 0} models
                  </div>
                </div>
              </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Trigger file input for uploading custom model
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          try {
                            // Convert to base64
                            const reader = new FileReader()
                            reader.onload = async (e) => {
                              const base64 = e.target?.result as string
                              if (base64) {
                                // Save directly to My Models with base64
                                try {
                                  await uploadModel({ 
                                    imageUrl: base64, // Use base64 directly
                                    name: file.name.replace(/\.[^/.]+$/, "") // Remove extension
                                  })
                                  console.log('✅ Model uploaded successfully')
                                } catch (uploadError) {
                                  console.error('❌ Upload model error:', uploadError)
                                  toast.error('Lỗi lưu model')
                                }
                              }
                            }
                            reader.readAsDataURL(file)
                          } catch (error) {
                            console.error('Upload error:', error)
                            toast.error('Lỗi upload ảnh')
                          }
                        }
                      }
                      input.click()
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Upload Model
                  </button>
                  
                </div>
                
                {/* Add bottom padding */}
                <div className="pb-5"></div>
              
              {isLoadingModels ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center py-8">
                    <LoadingText text="Đang tải models của bạn..." className="text-lg" />
                  </div>
                  <GridSkeleton items={6} columns={3} />
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No models yet</h4>
                  <p className="text-gray-600 mb-4">Generate your first AI model or upload a custom model</p>
                  <button
                    onClick={() => {
                      setShowMyModelsModal(false)
                      setShowPromptModal(true)
                    }}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Tạo Model AI
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {models.map((model) => (
                    <div key={model.id} className="relative group">
                      <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={model.image_url}
                          alt={model.prompt}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setPersonImage(model.image_url)
                            setShowMyModelsModal(false)
                          }}
                        />
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          toast.custom((t) => (
                            <motion.div
                              initial={{ opacity: 0, y: 20, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 20, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg flex flex-col items-center max-w-sm mx-auto"
                            >
                              <p className="text-lg font-semibold text-gray-900 mb-3">Xác nhận xóa Model</p>
                              <p className="text-sm text-gray-600 text-center mb-4">Bạn có chắc chắn muốn xóa model này? Hành động này không thể hoàn tác.</p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => toast.dismiss(t.id)}
                                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 text-sm font-medium transition-colors"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={async () => {
                                    toast.dismiss(t.id)
                                    try {
                                      await deleteModel(model.id)
                                      toast.success('🗑️ Đã xóa model!')
                                    } catch (error) {
                                      console.error('Delete error:', error)
                                      toast.error('❌ Lỗi xóa model')
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors"
                                >
                                  Xóa
                                </button>
                              </div>
                            </motion.div>
                          ), {
                            duration: Infinity, // Keep the toast open until dismissed
                            id: 'delete-model-confirm' // Unique ID to manage this toast
                          })
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all opacity-90 hover:opacity-100 shadow-lg hover:shadow-xl"
                        title="Xóa model"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      {/* Model Info */}
                      <div className="mt-2">
                        <p className="text-sm text-gray-900 truncate" title={model.prompt}>
                          {model.prompt}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(model.generated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      
      {/* Garment Selection Modal */}
      <GarmentSelectionModal
        isOpen={showGarmentSelectionModal}
        onClose={() => setShowGarmentSelectionModal(false)}
        onSelectFromDevice={handleSelectGarmentFromDevice}
        onSelectFromWardrobe={handleSelectGarmentFromWardrobe}
      />

      {/* Mini Wardrobe Modal */}
      <MiniWardrobeModal
        isOpen={showMiniWardrobeModal}
        onClose={() => setShowMiniWardrobeModal(false)}
        onSelectGarment={handleGarmentFromMiniWardrobe}
      />
      </div>
    </AuthGuard>
  )
}

export default function TryOnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <TryOnPageContent />
    </Suspense>
  )
}
