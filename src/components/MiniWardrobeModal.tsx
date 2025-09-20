'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSupabase } from './SupabaseProvider'
import { ImageSkeleton, LoadingText, GridSkeleton } from './SkeletonLoader'
import toast from 'react-hot-toast'
import { WardrobeItem } from '../app/wardrobe/page' // Re-using WardrobeItem interface
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Shirt, RectangleHorizontal, Sparkles, Footprints, ShoppingBag } from 'lucide-react' // New imports for icons

interface MiniWardrobeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectGarment: (item: WardrobeItem) => void
}

export default function MiniWardrobeModal({
  isOpen,
  onClose,
  onSelectGarment,
}: MiniWardrobeModalProps) {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const { session } = useSupabase()

  const fetchWardrobeItems = async () => {
    if (!session?.access_token) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/wardrobe', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setWardrobeItems(data.items || [])
      } else {
        console.error('Failed to fetch wardrobe items:', data.error)
        toast.error('Lỗi tải tủ đồ')
      }
    } catch (error) {
      console.error('Error fetching wardrobe items:', error)
      toast.error('Lỗi tải tủ đồ')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchWardrobeItems()
    }
  }, [isOpen, session])

  const filteredItems = wardrobeItems.filter(item => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'accessory') {
      return item.category === 'accessory' || item.category === 'accessories'
    }
    return item.category === selectedCategory
  })

  const categories = [
    { key: 'all', label: 'Tất cả', icon: <Shirt className="w-4 h-4 text-amber-600" />, count: wardrobeItems.length },
    { key: 'top', label: 'Áo', icon: <Shirt className="w-4 h-4 text-amber-600" />, count: wardrobeItems.filter(item => item.category === 'top').length },
    { key: 'bottom', label: 'Quần', icon: <RectangleHorizontal className="w-4 h-4 text-amber-600" />, count: wardrobeItems.filter(item => item.category === 'bottom').length },
    { key: 'dress', label: 'Đầm', icon: <Sparkles className="w-4 h-4 text-amber-600" />, count: wardrobeItems.filter(item => item.category === 'dress').length },
    { key: 'shoes', label: 'Giày', icon: <Footprints className="w-4 h-4 text-amber-600" />, count: wardrobeItems.filter(item => item.category === 'shoes').length },
    { key: 'accessory', label: 'Phụ kiện', icon: <ShoppingBag className="w-4 h-4 text-amber-600" />, count: wardrobeItems.filter(item => item.category === 'accessory' || item.category === 'accessories').length },
    { key: 'outerwear', label: 'Áo khoác', icon: <Shirt className="w-4 h-4 text-amber-600" />, count: wardrobeItems.filter(item => item.category === 'outerwear').length }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-amber-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-6">Chọn từ Tủ đồ của bạn</h3>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.key
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white border border-amber-200 hover:border-amber-300 text-amber-700'
                  }`}
                >
                  <span className="text-base">{category.icon}</span>
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

            {isLoading ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-8">
                  <LoadingText text="Đang tải tủ đồ của bạn..." className="text-lg" />
                </div>
                <GridSkeleton items={6} columns={3} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Chưa có trang phục nào trong danh mục này.</p>
                <p className="text-sm text-gray-500 mt-2">Tải lên trang phục mới trên trang Tủ đồ của bạn.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative group aspect-square bg-amber-50 rounded-xl overflow-hidden border border-amber-200 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all"
                    onClick={() => onSelectGarment(item)}
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckIcon className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
