'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faDownload, faTrash, faFilter, faChevronDown, faImage } from '@fortawesome/free-solid-svg-icons'
import { ImageModal } from './ImageModal'
import { useHistory, useDeleteHistory } from '../hooks/useHistory'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ImageSkeleton } from './SkeletonLoader'

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
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  
  // Use React Query hooks
  const [page, setPage] = useState(1)
  const pageSize = 15
  const { data, isLoading: loading, error } = useHistory(page, pageSize)
  const historyItems: HistoryItem[] = (data?.items as any) || []
  const total = data?.total || 0
  const hasMore = page * pageSize < total
  const deleteHistoryMutation = useDeleteHistory()
  const queryClient = useQueryClient()

  // Filter history items by date
  const filteredHistoryItems = useMemo(() => {
    if (dateFilter === 'all') return historyItems
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    return historyItems.filter((item: HistoryItem) => {
      const itemDate = new Date(item.created_at)
      
      switch (dateFilter) {
        case 'today':
          return itemDate >= today
        case 'week':
          return itemDate >= weekAgo
        case 'month':
          return itemDate >= monthAgo
        default:
          return true
      }
    })
  }, [historyItems, dateFilter])

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Past 7 days' },
    { value: 'month', label: 'Past 30 days' }
  ]

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
      toast.success('Xóa thành công!')
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
        <p className="text-gray-500 mt-4">Loading history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error occurred while loading history</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Try Again
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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">Try-On History</h2>
          <p className="text-amber-600 mt-1 text-sm">{total} images created</p>
        </div>
        
        {/* Date Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors text-sm font-medium"
          >
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
            <span>{filterOptions.find(opt => opt.value === dateFilter)?.label}</span>
            <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4" />
          </button>
          
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-amber-200 z-10">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDateFilter(option.value as any)
                    setShowFilterDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    dateFilter === option.value ? 'bg-amber-100 text-amber-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {historyItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faClock} className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No history yet
          </h3>
          <p className="text-amber-700 mb-6">
            Try on clothing to see history here
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg"
          >
            Try-On Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredHistoryItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden hover:shadow-md transition-shadow">
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
                    onLoad={() => {
                      setLoadedImages(prev => new Set(prev).add(item.result_image_url))
                    }}
                    onError={() => {
                      console.error('Failed to load image:', item.result_image_url)
                    }}
                  />
                  {/* Loading overlay - only show if image not loaded */}
                  {!loadedImages.has(item.result_image_url) && (
                    <div className="absolute inset-0 bg-amber-50 rounded-lg flex items-center justify-center">
                      <ImageSkeleton aspectRatio="aspect-[4/3]" className="bg-amber-100" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(item.result_image_url, `clothify-result-${item.id}.jpg`)
                      }}
                      className="p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faDownload} className="w-3 h-3 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                      className="p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
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
                        <FontAwesomeIcon icon={faImage} className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        <FontAwesomeIcon icon={faImage} className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Tải thêm
          </button>
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
