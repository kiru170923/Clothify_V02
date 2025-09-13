'use client'

import { useState, useEffect } from 'react'
import { Clock, Download, Trash2 } from 'lucide-react'

interface RecentImage {
  id: string
  personImage: string
  clothingImage: string
  resultImage: string
  createdAt: string
}

export function RecentImages() {
  const [recentImages, setRecentImages] = useState<RecentImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - sẽ thay thế bằng API call thực tế
    const mockData: RecentImage[] = [
      {
        id: '1',
        personImage: '/api/placeholder/200/300',
        clothingImage: '/api/placeholder/200/200',
        resultImage: '/api/placeholder/200/300',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        personImage: '/api/placeholder/200/300',
        clothingImage: '/api/placeholder/200/200',
        resultImage: '/api/placeholder/200/300',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]
    
    setTimeout(() => {
      setRecentImages(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  const handleDelete = (id: string) => {
    setRecentImages(prev => prev.filter(img => img.id !== id))
    // TODO: Call API to delete from database
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Đang tải lịch sử...</p>
        </div>
      </div>
    )
  }

  if (recentImages.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chưa có ảnh nào
          </h3>
          <p className="text-gray-500">
            Hãy thử đồ để xem lịch sử ở đây
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-6 h-6 text-primary-500" />
        <h2 className="text-2xl font-bold text-gray-900">
          Ảnh đã thử gần đây
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentImages.map((image) => (
          <div key={image.id} className="card card-hover">
            <div className="space-y-4">
              {/* Result Image */}
              <div className="relative">
                <img
                  src={image.resultImage}
                  alt="Kết quả thử đồ"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleDownload(image.resultImage, `clothify-result-${image.id}.jpg`)}
                    className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Download className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Input Images Preview */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <img
                    src={image.personImage}
                    alt="Ảnh bản thân"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bản thân</p>
                </div>
                <div className="text-center">
                  <img
                    src={image.clothingImage}
                    alt="Quần áo"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Quần áo</p>
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-sm text-gray-500 text-center">
                {new Date(image.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
