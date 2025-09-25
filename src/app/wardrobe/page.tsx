'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import toast from 'react-hot-toast'
import { useSupabase } from '../../components/SupabaseProvider'
import { GridSkeleton, ImageSkeleton, LoadingText } from '../../components/SkeletonLoader'
import AuthGuard from '../../components/AuthGuard'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShirt, faTshirt, faBagShopping } from '@fortawesome/free-solid-svg-icons'

export interface WardrobeItem {
  id: string
  user_id: string
  image_url: string
  name: string
  category: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory' | 'accessories' | 'outerwear'
  subcategory: string
  color: string
  style: string
  season: string
  gender: string
  confidence: number
  description: string
  created_at: string
}

export default function WardrobePage() {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 15
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // New state for upload loading
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  
  const { session } = useSupabase()

  // Fetch wardrobe items
  const fetchWardrobeItems = async (nextPage = 1, reset = false) => {
    if (!session?.access_token) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/wardrobe?page=${nextPage}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setTotal(data.total || 0)
        if (reset || nextPage === 1) {
          setWardrobeItems(data.items || [])
        } else {
          setWardrobeItems(prev => [...prev, ...(data.items || [])])
        }
      } else {
        console.error('Failed to fetch wardrobe items:', data.error)
      }
    } catch (error) {
      console.error('Error fetching wardrobe items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWardrobeItems(1, true)
    setPage(1)
  }, [session])

  // Delete wardrobe item
  const deleteWardrobeItem = async (id: string) => {
    if (!session?.access_token) return
    
    try {
      const response = await fetch(`/api/wardrobe?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        setWardrobeItems(prev => prev.filter(item => item.id !== id))
        toast.success('🗑️ Đã xóa trang phục!')
      } else {
        toast.error('❌ Lỗi xóa trang phục')
      }
    } catch (error) {
      console.error('Error deleting wardrobe item:', error)
      toast.error('❌ Lỗi xóa trang phục')
    }
  }

  // Upload wardrobe item
  const uploadWardrobeItem = async (file: File) => {
    if (!session?.access_token) return
    
    setIsUploading(true) // Set uploading state to true
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        if (base64) {
          const response = await fetch('/api/wardrobe', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: base64,
              name: file.name.replace(/\.[^/.]+$/, "")
            })
          })

          if (response.ok) {
            await fetchWardrobeItems() // Refresh list
            toast.success('✅ Đã thêm trang phục vào tủ đồ!')
          } else {
            toast.error('❌ Lỗi thêm trang phục')
          }
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading wardrobe item:', error)
      toast.error('❌ Lỗi upload trang phục')
    } finally {
      setIsUploading(false) // Reset uploading state to false
    }
  }

  // Filter items by category
  const filteredItems = wardrobeItems.filter(item => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'accessory') {
      return item.category === 'accessory' || item.category === 'accessories'
    }
    return item.category === selectedCategory
  })

  const categories = [
    { key: 'all', label: 'All', icon: <FontAwesomeIcon icon={faShirt} className="w-4 h-4" />, count: wardrobeItems.length },
    { key: 'top', label: 'Top', icon: <FontAwesomeIcon icon={faShirt} className="w-4 h-4" />, count: wardrobeItems.filter(item => item.category === 'top').length },
    { key: 'bottom', label: 'Bottom', icon: <FontAwesomeIcon icon={faTshirt} className="w-4 h-4" />, count: wardrobeItems.filter(item => item.category === 'bottom').length },
    { key: 'dress', label: 'Dress', icon: <FontAwesomeIcon icon={faTshirt} className="w-4 h-4" />, count: wardrobeItems.filter(item => item.category === 'dress').length },
    { key: 'shoes', label: 'Shoes', icon: <FontAwesomeIcon icon={faShirt} className="w-4 h-4" />, count: wardrobeItems.filter(item => item.category === 'shoes').length },
    { key: 'accessory', label: 'Accessories', icon: <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4" />, count: wardrobeItems.filter(item => item.category === 'accessory' || item.category === 'accessories').length },
    { key: 'outerwear', label: 'Outerwear', icon: <FontAwesomeIcon icon={faShirt} className="w-4 h-4" />, count: wardrobeItems.filter(item => item.category === 'outerwear').length }
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50" style={{ backgroundColor: '#f6f1e9' }}>
        <Header />
        
        <div className="flex">
          <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent mb-4">
                Your Wardrobe ✨
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Manage and categorize your clothing with AI
              </p>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">Categories</h3>
                <button
                  onClick={() => setShowUploadModal(true)}
                  disabled={isUploading} // Disable button during upload
                  className={`flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Add Clothing'}
                  {isUploading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>} {/* Loading spinner */}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category.key
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-amber-600">{category.icon}</span>
                    <span>{category.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedCategory === category.key
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wardrobe Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {isLoading ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center py-8">
                    <LoadingText text="Đang tải tủ đồ của bạn..." className="text-lg" />
                  </div>
                  <GridSkeleton items={8} columns={4} />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedCategory === 'all' ? 'No clothing items' : `No ${categories.find(c => c.key === selectedCategory)?.label.toLowerCase()}`}
                  </h4>
                  <p className="text-gray-600 mb-4">Add your first clothing item to get started</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Add Clothing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setZoomedImage(item.image_url)}
                        />
                      </div>
                      
                      {/* Delete Button (no confirm) */}
                      <button
                        onClick={() => deleteWardrobeItem(item.id)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all opacity-90 hover:opacity-100 shadow-lg"
                        title="Xóa trang phục"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      {/* Item Info */}
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-900 truncate" title={item.name}>
                          {item.name}
                        </p>
                        
                        {/* AI Classification Info */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-1 rounded-full text-white font-medium ${
                            item.category === 'top' ? 'bg-amber-500' :
                            item.category === 'bottom' ? 'bg-yellow-500' :
                            item.category === 'dress' ? 'bg-amber-400' :
                            item.category === 'shoes' ? 'bg-orange-500' :
                            item.category === 'accessories' ? 'bg-amber-600' :
                            item.category === 'outerwear' ? 'bg-yellow-600' :
                            'bg-gray-400'
                          }`}>
                            {item.category === 'top' ? 'Top' :
                             item.category === 'bottom' ? 'Bottom' :
                             item.category === 'dress' ? 'Dress' :
                             item.category === 'shoes' ? 'Shoes' :
                             item.category === 'accessories' ? 'Accessories' :
                             item.category === 'outerwear' ? 'Outerwear' :
                             item.category}
                          </span>
                          <span className="text-gray-500">
                            {item.color} • {item.style}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {page * pageSize < total && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    const next = page + 1
                    setPage(next)
                    fetchWardrobeItems(next)
                  }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Tải thêm
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global uploading overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg px-5 py-4 shadow">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-800">Đang thêm trang phục...</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="font-semibold text-gray-900 mb-4">Add Clothing to Wardrobe</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        uploadWardrobeItem(file)
                        setShowUploadModal(false)
                      }
                    }}
                    className="hidden"
                    id="wardrobe-upload"
                  />
                  <label
                    htmlFor="wardrobe-upload"
                    className="cursor-pointer"
                  >
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-gray-600 mb-2">Nhấp để chọn ảnh trang phục</p>
                    <p className="text-sm text-gray-500">AI sẽ tự động phân loại trang phục</p>
                  </label>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Modal */}
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
    </AuthGuard>
  )
}