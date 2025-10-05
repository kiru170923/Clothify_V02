'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  HeartIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useWardrobeManager } from '@/lib/wardrobeManager'

interface WardrobeManagerProps {
  onItemSelect?: (item: any) => void
  onOutfitSelect?: (outfit: any) => void
  disabled?: boolean
}

export default function WardrobeManager({ 
  onItemSelect, 
  onOutfitSelect,
  disabled = false 
}: WardrobeManagerProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'outfits' | 'stats' | 'recommendations'>('items')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'top' as const,
    subcategory: '',
    brand: '',
    color: '',
    size: '',
    material: '',
    style: '',
    imageUrl: '',
    price: 0,
    tags: [] as string[],
    rating: 5,
    notes: '',
    isFavorite: false
  })

  const {
    getAllItems,
    getItemsByCategory,
    searchItems,
    addItem,
    updateItem,
    deleteItem,
    wearItem,
    getAllOutfits,
    createOutfit,
    wearOutfit,
    getWardrobeStats,
    generateRecommendations,
    exportWardrobe,
    importWardrobe
  } = useWardrobeManager()

  const [items, setItems] = useState<any[]>([])
  const [outfits, setOutfits] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setItems(getAllItems())
    setOutfits(getAllOutfits())
    setStats(getWardrobeStats())
    setRecommendations(generateRecommendations())
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      setItems(searchItems(query))
    } else {
      setItems(getAllItems())
    }
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    if (category === 'all') {
      setItems(getAllItems())
    } else {
      setItems(getItemsByCategory(category as any))
    }
  }

  const handleAddItem = () => {
    if (newItem.name && newItem.category && newItem.color) {
      const addedItem = addItem({...newItem, isActive: true})
      if (addedItem) {
        setNewItem({
          name: '',
          category: 'top',
          subcategory: '',
          brand: '',
          color: '',
          size: '',
          material: '',
          style: '',
          imageUrl: '',
          price: 0,
          tags: [],
          rating: 5,
          notes: '',
          isFavorite: false
        })
        setShowAddModal(false)
        loadData()
      }
    }
  }

  const handleToggleFavorite = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      updateItem(itemId, { isFavorite: !item.isFavorite })
      loadData()
    }
  }

  const handleWearItem = (itemId: string) => {
    wearItem(itemId)
    loadData()
  }

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Bạn có chắc muốn xóa trang phục này?')) {
      deleteItem(itemId)
      loadData()
    }
  }

  const handleExport = () => {
    const data = exportWardrobe()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wardrobe-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result as string
        if (importWardrobe(data)) {
          loadData()
          alert('Import thành công!')
        } else {
          alert('Import thất bại!')
        }
      }
      reader.readAsText(file)
    }
  }

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'top', label: 'Áo' },
    { value: 'bottom', label: 'Quần' },
    { value: 'shoes', label: 'Giày' },
    { value: 'accessories', label: 'Phụ kiện' },
    { value: 'outerwear', label: 'Áo khoác' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý tủ đồ</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            disabled={disabled}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />
            Thêm trang phục
          </button>
          <button
            onClick={handleExport}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
          <label className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <ArrowUpTrayIcon className="w-4 h-4" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'items', label: 'Trang phục', icon: PlusIcon },
          { id: 'outfits', label: 'Outfit', icon: EyeIcon },
          { id: 'stats', label: 'Thống kê', icon: ChartBarIcon },
          { id: 'recommendations', label: 'Gợi ý', icon: LightBulbIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trang phục..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 bg-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <PlusIcon className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                    >
                      {item.isFavorite ? (
                        <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3 space-y-2">
                    <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Màu: {item.color}</p>
                      <p>Size: {item.size}</p>
                      <p>Phong cách: {item.style}</p>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`w-3 h-3 ${
                            star <= item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">({item.wearCount} lần mặc)</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleWearItem(item.id)}
                        className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      >
                        Mặc
                      </button>
                      <button
                        onClick={() => onItemSelect?.(item)}
                        className="px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-2 py-1 border border-red-300 text-red-600 text-xs rounded hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <PlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có trang phục nào</p>
                <p className="text-sm">Thêm trang phục đầu tiên của bạn</p>
              </div>
            )}
          </div>
        )}

        {/* Outfits Tab */}
        {activeTab === 'outfits' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outfits.map((outfit) => (
                <motion.div
                  key={outfit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4 space-y-3">
                    <h3 className="font-medium text-gray-800">{outfit.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Dịp: {outfit.occasion}</p>
                      <p>Mùa: {outfit.season}</p>
                      <p>Phong cách: {outfit.style}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => wearOutfit(outfit.id)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Mặc outfit
                      </button>
                      <button
                        onClick={() => onOutfitSelect?.(outfit)}
                        className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {outfits.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <EyeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có outfit nào</p>
                <p className="text-sm">Tạo outfit đầu tiên của bạn</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-3">Tổng quan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng trang phục:</span>
                  <span className="font-medium">{stats.totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá trị tổng:</span>
                  <span className="font-medium">{stats.totalValue.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đánh giá TB:</span>
                  <span className="font-medium">{stats.averageRating.toFixed(1)}/5</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-3">Theo danh mục</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(stats.itemsByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{category}:</span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-3">Tần suất mặc</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hàng ngày:</span>
                  <span className="font-medium">{stats.wearFrequency.daily}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hàng tuần:</span>
                  <span className="font-medium">{stats.wearFrequency.weekly}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hàng tháng:</span>
                  <span className="font-medium">{stats.wearFrequency.monthly}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ít mặc:</span>
                  <span className="font-medium">{stats.wearFrequency.rarely}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{rec.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {rec.priority === 'high' ? 'Ưu tiên cao' :
                         rec.priority === 'medium' ? 'Ưu tiên trung bình' : 'Ưu tiên thấp'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <LightBulbIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </motion.div>
            ))}

            {recommendations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <LightBulbIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Không có gợi ý nào</p>
                <p className="text-sm">Tủ đồ của bạn đang ở trạng thái tốt</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Thêm trang phục</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên trang phục
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: Áo sơ mi trắng"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Danh mục
                    </label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="top">Áo</option>
                      <option value="bottom">Quần</option>
                      <option value="shoes">Giày</option>
                      <option value="accessories">Phụ kiện</option>
                      <option value="outerwear">Áo khoác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Màu sắc
                    </label>
                    <input
                      type="text"
                      value={newItem.color}
                      onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ví dụ: Trắng"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <input
                      type="text"
                      value={newItem.size}
                      onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ví dụ: M"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phong cách
                    </label>
                    <input
                      type="text"
                      value={newItem.style}
                      onChange={(e) => setNewItem({ ...newItem, style: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ví dụ: Casual"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL ảnh
                  </label>
                  <input
                    type="url"
                    value={newItem.imageUrl}
                    onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleAddItem}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Thêm
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
