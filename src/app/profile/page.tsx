'use client'

import { useSupabase } from '../../components/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Download, Trash2, Calendar } from 'lucide-react'
import { ImageModal } from '../../components/ImageModal'

interface ProfileImage {
  id: string
  personImage: string
  clothingImage: string
  resultImage: string
  createdAt: string
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useSupabase()
  const router = useRouter()
  const [images, setImages] = useState<ProfileImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      // TODO: Fetch real data from Supabase
      // For now, show empty state
      setImages([])
      setLoading(false)
    }
  }, [user, authLoading, router])

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  const handleDelete = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
    // TODO: Call API to delete from database
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Quản lý ảnh và lịch sử thử đồ</p>
          </div>
        </div>

        {/* User Info */}
        <div className="card mb-8">
          <div className="flex items-center gap-4">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.user_metadata?.full_name || 'User'}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Tất cả ảnh đã thử ({images.length})
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Sắp xếp theo ngày tạo
            </div>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có ảnh nào
              </h4>
              <p className="text-gray-500 mb-6">
                Hãy thử đồ để xem lịch sử ở đây
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn btn-primary"
              >
                Thử đồ ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div key={image.id} className="card card-hover">
                  <div className="space-y-4">
                    {/* Result Image */}
                    <div className="relative">
                      <img
                        src={image.resultImage}
                        alt="Kết quả thử đồ"
                        className="w-full h-48 object-cover rounded-xl cursor-pointer"
                        onClick={() => {
                          setSelectedImage(image.resultImage)
                          setShowImageModal(true)
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => handleDownload(image.resultImage, `clothify-result-${image.id}.jpg`)}
                          className="p-2 bg-white rounded-full shadow-lg"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="p-2 bg-red-500 text-white rounded-full"
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
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <ImageModal
            imageUrl={selectedImage}
            isOpen={showImageModal}
            onClose={() => {
              setShowImageModal(false)
              setSelectedImage(null)
            }}
            title="Kết quả thử đồ"
          />
        )}
      </div>
    </div>
  )
}
