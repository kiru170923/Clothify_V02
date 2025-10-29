'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PhotoIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

export default function NewQRCodePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [maxUses, setMaxUses] = useState<number | undefined>()
  const [expiresAt, setExpiresAt] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh phải nhỏ hơn 10MB')
      return
    }

    setSelectedFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error('Vui lòng chọn ảnh sản phẩm')
      return
    }

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên QR code')
      return
    }

    try {
      setLoading(true)
      toast.loading('Đang tạo QR code...', { id: 'create-qr' })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Vui lòng đăng nhập', { id: 'create-qr' })
        router.push('/login')
        return
      }

      // 1. Upload clothing image first
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `qr-clothing/${session.user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        
        // Check common errors
        if (uploadError.message?.includes('bucket')) {
          throw new Error('Storage bucket "images" chưa được tạo. Vui lòng tạo bucket trong Supabase Storage.')
        } else if (uploadError.message?.includes('policy')) {
          throw new Error('Chưa có quyền upload. Vui lòng check Storage policies trong Supabase.')
        } else {
          throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`)
        }
      }

      if (!uploadData) {
        throw new Error('Upload returned no data')
      }

      // Get public URL
      const { data: { publicUrl: clothingImageUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(uploadData.path)

      // 2. Generate QR code
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clothingImageUrl,
          name: name.trim(),
          maxUses: maxUses || null,
          expiresAt: expiresAt || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create QR code')
      }

      toast.success('QR code đã được tạo thành công! 🎉', { id: 'create-qr' })
      router.push('/qr-codes')

    } catch (error: any) {
      console.error('Error creating QR:', error)
      toast.error(error.message || 'Có lỗi xảy ra', { id: 'create-qr' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Tạo QR Code Mới</h1>
          <p className="text-gray-600 mt-1">Tạo mã QR để chia sẻ tính năng thử đồ ảo</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Name */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Tên QR Code *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Áo polo TORANO"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Ảnh sản phẩm *
              </label>
              
              {!previewUrl ? (
                <label className="block">
                  <div className="border-4 border-dashed border-amber-300 rounded-xl p-12 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                    <PhotoIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">Chọn ảnh sản phẩm</p>
                    <p className="text-sm text-gray-500">PNG, JPG hoặc WEBP (max 10MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 max-w-xs">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                    className="mt-3 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Chọn ảnh khác
                  </button>
                </div>
              )}
            </div>

            {/* Optional Settings */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Cài đặt nâng cao (tùy chọn)</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới hạn số lần quét
                  </label>
                  <input
                    type="number"
                    value={maxUses || ''}
                    onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Không giới hạn"
                    min="1"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Để trống nếu không giới hạn</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày hết hạn
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Để trống nếu không hết hạn</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !selectedFile || !name.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <QrCodeIcon className="w-5 h-5" />
                {loading ? 'Đang tạo...' : 'Tạo QR Code'}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h4 className="font-bold text-blue-900 mb-2">💡 Lưu ý quan trọng:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Mỗi lần người dùng quét QR và thử đồ sẽ tốn <strong>1 token</strong> của bạn</li>
            <li>• Đảm bảo tài khoản có đủ token trước khi chia sẻ QR</li>
            <li>• Bạn có thể vô hiệu hóa QR bất cứ lúc nào</li>
            <li>• QR code không thể chỉnh sửa sau khi tạo, chỉ có thể xóa và tạo mới</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

