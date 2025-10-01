'use client'

import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faUpload, faPlus, faTag } from '@fortawesome/free-solid-svg-icons'
import UploadCard from './UploadCard'
import { useWardrobe, useDeleteWardrobe } from '../hooks/useWardrobe'
import { useSupabase } from './SupabaseProvider'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

interface WardrobeItem {
  id: string
  image: string
  category: string
  name: string
  createdAt: string
}

export const WardrobeTab = React.memo(function WardrobeTab() {
  const { session } = useSupabase() as any
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { data, isLoading } = useWardrobe(page, pageSize)
  const items = data?.items || []
  const total = data?.total || 0
  const hasMore = page * pageSize < total
  const deleteMutation = useDeleteWardrobe()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isUploading, setIsUploading] = useState(false)

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
    ? items 
    : items.filter((item: any) => item.category === selectedCategory)

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
          disabled={isUploading}
          className={`btn btn-primary flex items-center gap-2 ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang thêm...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Thêm đồ
            </>
          )}
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
      {isLoading ? (
        <div className="text-center py-16">Đang tải tủ đồ...</div>
      ) : filteredItems.length === 0 ? (
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
            disabled={isUploading}
            className={`btn btn-primary ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              <span className="inline-flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang thêm...
              </span>
            ) : (
              'Thêm đồ đầu tiên'
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full aspect-square object-cover"
              />
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FontAwesomeIcon icon={faTag} className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
                <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button onClick={() => deleteMutation.mutate(item.id)} className="text-xs text-red-600">Xoá</button>
                  <button
                    onClick={async () => {
                      try {
                        // Build a simple description block for chatbot
                        const desc = `Phân tích trang phục trong tủ đồ:\n- Tên: ${item.name}\n- Loại: ${item.category}\n- Ảnh: ${item.image_url}\n\nHãy tư vấn cách phối đồ từ các sản phẩm trong tủ đồ (ưu tiên matching style/occasion).`
                        localStorage.setItem('simple-chatbot-incoming', JSON.stringify({ role: 'user', content: desc }))
                        window.open('/simple-chat', '_blank')
                      } catch {}
                    }}
                    className="text-xs text-amber-700 hover:underline"
                  >Phân tích & tư vấn</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-4">
          <button onClick={() => setPage((p)=>p+1)} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Tải thêm</button>
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
                  if (!image || !session?.access_token) return
                  setIsUploading(true)
                  ;(async () => {
                    try {
                      const res = await fetch('/api/wardrobe', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ imageUrl: image, name: 'Quần áo mới' })
                      })
                      if (!res.ok) {
                        const txt = await res.text()
                        throw new Error(txt || 'Upload failed')
                      }
                      toast.success('Đã thêm trang phục vào tủ đồ')
                      setShowUploadModal(false)
                      queryClient.invalidateQueries({ queryKey: ['wardrobe'] })
                    } catch (e: any) {
                      toast.error('Lỗi upload trang phục')
                    } finally {
                      setIsUploading(false)
                    }
                  })()
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

      {isUploading && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg px-5 py-4 shadow">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-800">Đang thêm trang phục...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
