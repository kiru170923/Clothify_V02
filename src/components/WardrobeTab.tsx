'use client'

import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faUpload, faPlus, faTag } from '@fortawesome/free-solid-svg-icons'
import UploadCard from './UploadCard'

interface WardrobeItem {
  id: string
  image: string
  category: string
  name: string
  createdAt: string
}

export const WardrobeTab = React.memo(function WardrobeTab() {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'shirt', label: 'Áo sơ mi' },
    { id: 't-shirt', label: 'Áo thun' },
    { id: 'pants', label: 'Quần' },
    { id: 'dress', label: 'Váy' },
    { id: 'jacket', label: 'Áo khoác' },
    { id: 'shoes', label: 'Giày' },
    { id: 'accessories', label: 'Phụ kiện' },
  ]

  const filteredItems = selectedCategory === 'all' 
    ? wardrobeItems 
    : wardrobeItems.filter(item => item.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tủ đồ của bạn</h2>
          <p className="text-gray-600 mt-2">Quản lý và phân loại quần áo</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Thêm đồ
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Wardrobe Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faCamera} className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có đồ nào
          </h3>
          <p className="text-gray-500 mb-6">
            Hãy thêm quần áo vào tủ đồ của bạn
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            Thêm đồ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full aspect-square object-cover"
              />
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FontAwesomeIcon icon={faTag} className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
                <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Thêm đồ vào tủ</h3>
            
            <div className="space-y-4">
              <UploadCard
                label="Upload ảnh quần áo"
                image={null}
                onChange={(image) => {
                  if (image) {
                    const newItem: WardrobeItem = {
                      id: Date.now().toString(),
                      image,
                      category: 'shirt',
                      name: 'Quần áo mới',
                      createdAt: new Date().toISOString(),
                    }
                    setWardrobeItems(prev => [...prev, newItem])
                    setShowUploadModal(false)
                  }
                }}
                type="clothing"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
