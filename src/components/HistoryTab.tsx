'use client'

import { useState, useEffect } from 'react'
import { History, Download, Trash2, Calendar, Image as ImageIcon } from 'lucide-react'
import { ImageModal } from './ImageModal'
import { useSupabase } from './SupabaseProvider'

interface HistoryItem {
  id: string
  person_image_url: string
  clothing_image_url: string
  result_image_url: string
  created_at: string
  processing_time?: number // in milliseconds
}

export function HistoryTab() {
  const { session } = useSupabase()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!session?.access_token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/clothify/history', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('HistoryTab - Fetched data:', data)
          console.log('HistoryTab - Data length:', data.length)
          setHistoryItems(data)
        } else {
          console.error('Failed to fetch history:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [session])

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to direct link
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = filename
      link.target = '_blank'
      link.click()
    }
  }

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return

    try {
      const response = await fetch('/api/clothify/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        // Only remove from UI if API call succeeds
        setHistoryItems(prev => prev.filter(item => item.id !== id))
      } else {
        console.error('Failed to delete record:', response.status)
      }
    } catch (error) {
      console.error('Error deleting record:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Lịch sử thử đồ</h2>
          <p className="text-gray-600 mt-2">Tất cả ảnh đã thử ({historyItems.length})</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          Sắp xếp theo ngày tạo
        </div>
      </div>

      {historyItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có lịch sử nào
          </h3>
          <p className="text-gray-500 mb-6">
            Hãy thử đồ để xem lịch sử ở đây
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Thử đồ ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="space-y-4 p-4">
                {/* Result Image */}
                <div className="relative">
                  <img
                    src={item.result_image_url}
                    alt="Kết quả thử đồ"
                    className="w-full h-48 object-cover rounded-xl cursor-pointer"
                    onClick={() => {
                      setSelectedImage(item.result_image_url)
                      setShowImageModal(true)
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleDownload(item.result_image_url, `clothify-result-${item.id}.jpg`)}
                      className="p-2 bg-white rounded-full shadow-lg"
                    >
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-500 text-white rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Input Images Preview */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="relative">
                      <img
                        src={item.person_image_url}
                        alt="Ảnh bản thân"
                        className="w-full h-20 object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          setSelectedImage(item.person_image_url)
                          setShowImageModal(true)
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Bản thân</p>
                  </div>
                  <div className="text-center">
                    <div className="relative">
                      <img
                        src={item.clothing_image_url}
                        alt="Quần áo"
                        className="w-full h-20 object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          setSelectedImage(item.clothing_image_url)
                          setShowImageModal(true)
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Quần áo</p>
                  </div>
                </div>

                {/* Timestamp and Processing Time */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 text-center">
                    {new Date(item.created_at).toLocaleString('vi-VN')}
                  </p>
                  {item.processing_time && (
                    <p className="text-xs text-gray-400 text-center">
                      Xử lý: {Math.round(item.processing_time / 1000)}s
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false)
            setSelectedImage(null)
          }}
          title="Xem ảnh"
        />
      )}
    </div>
  )
}
