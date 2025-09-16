'use client'

import React, { useState, useCallback } from 'react'
import { History, Download, Trash2, Calendar, Image as ImageIcon } from 'lucide-react'
import { ImageModal } from './ImageModal'
import { useHistory, useDeleteHistory } from '../hooks/useHistory'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface HistoryItem {
  id: string
  person_image_url: string
  clothing_image_url: string
  result_image_url: string
  created_at: string
  processing_time?: number // in milliseconds
}

export const HistoryTab = React.memo(function HistoryTab() {
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  // Use React Query hooks
  const { data: historyItems = [], isLoading: loading, error } = useHistory()
  const deleteHistoryMutation = useDeleteHistory()
  const queryClient = useQueryClient()

  const handleDownload = useCallback(async (imageUrl: string, filename: string) => {
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
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic update - immediately remove from UI
    const previousData = queryClient.getQueryData(['history'])
    
    // Update UI immediately
    queryClient.setQueryData(['history'], (old: any) => 
      old?.filter((item: any) => item.id !== id) || []
    )
    
    try {
      await deleteHistoryMutation.mutateAsync(id)
      toast.success('Đã xóa thành công!')
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(['history'], previousData)
      toast.error('Không thể xóa, vui lòng thử lại')
      console.error('Error deleting record:', error)
    }
  }, [deleteHistoryMutation, queryClient])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-gray-500 mt-4">Đang tải lịch sử...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-red-500 mb-4">Có lỗi xảy ra khi tải lịch sử</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lịch sử thử đồ</h2>
          <p className="text-gray-600 mt-1 text-sm">{historyItems.length} ảnh đã tạo</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          Sắp xếp theo ngày
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {historyItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="space-y-3 p-3">
                {/* Result Image */}
                <div className="relative">
                  <img
                    src={item.result_image_url}
                    alt="Kết quả thử đồ"
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setSelectedImage(item.result_image_url)
                      setShowImageModal(true)
                    }}
                  />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(item.result_image_url, `clothify-result-${item.id}.jpg`)
                      }}
                      className="p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <Download className="w-3 h-3 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                      className="p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Input Images Preview */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="relative group">
                      <img
                        src={item.person_image_url}
                        alt="Ảnh bản thân"
                        className="w-full h-16 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setSelectedImage(item.person_image_url)
                          setShowImageModal(true)
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-md flex items-center justify-center">
                        <ImageIcon className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Bản thân</p>
                  </div>
                  <div className="text-center">
                    <div className="relative group">
                      <img
                        src={item.clothing_image_url}
                        alt="Quần áo"
                        className="w-full h-16 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setSelectedImage(item.clothing_image_url)
                          setShowImageModal(true)
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-md flex items-center justify-center">
                        <ImageIcon className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Quần áo</p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
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
        />
      )}
    </div>
  )
})
