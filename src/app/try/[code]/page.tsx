'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { SparklesIcon, PhotoIcon, ArrowUpTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface QRInfo {
  code: string
  name: string
  clothingImageUrl: string
  isActive: boolean
  isUsable: boolean
  isExpired: boolean
  isMaxUsesReached: boolean
  maxUses?: number
  currentScans: number
  expiresAt?: string
}

export default function PublicTryOnPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [qrInfo, setQrInfo] = useState<QRInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null)

  // Fetch QR info on mount
  useEffect(() => {
    fetchQRInfo()
  }, [resolvedParams.code])

  const fetchQRInfo = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/qr/${resolvedParams.code}/info`)
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'QR code not found')
        return
      }

      setQrInfo(data.qrCode)
    } catch (error) {
      console.error('Error fetching QR info:', error)
      toast.error('Failed to load QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleTryOn = async () => {
    if (!selectedFile || !qrInfo) return

    try {
      setProcessing(true)
      toast.loading('Đang xử lý thử đồ ảo...', { id: 'tryon' })

      const formData = new FormData()
      formData.append('userImage', selectedFile)

      const res = await fetch(`/api/qr/${resolvedParams.code}/try-on`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.insufficientTokens) {
          toast.error('QR code owner đã hết token. Vui lòng liên hệ chủ QR.', { id: 'tryon' })
        } else if (res.status === 429) {
          toast.error('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.', { id: 'tryon' })
        } else {
          toast.error(data.error || 'Thử đồ thất bại', { id: 'tryon' })
        }
        return
      }

      setResultImageUrl(data.resultImageUrl)
      toast.success('Thử đồ thành công! 🎉', { id: 'tryon' })

    } catch (error) {
      console.error('Try-on error:', error)
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.', { id: 'tryon' })
    } finally {
      setProcessing(false)
    }
  }

  const downloadResult = () => {
    if (!resultImageUrl) return
    
    const link = document.createElement('a')
    link.href = resultImageUrl
    link.download = `clothify-tryon-${Date.now()}.png`
    link.click()
    toast.success('Đang tải xuống...')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50">
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!qrInfo || !qrInfo.isUsable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {qrInfo?.isExpired ? 'QR Code Đã Hết Hạn' :
             qrInfo?.isMaxUsesReached ? 'QR Code Đã Đạt Giới Hạn' :
             'QR Code Không Khả Dụng'}
          </h1>
          <p className="text-gray-600">
            {qrInfo?.isExpired ? 'QR code này đã hết hạn sử dụng.' :
             qrInfo?.isMaxUsesReached ? 'QR code này đã đạt số lần quét tối đa.' :
             'QR code này hiện không thể sử dụng.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Clothify Virtual Try-On</h1>
              <p className="text-sm text-gray-600">{qrInfo.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!resultImageUrl ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Clothing Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Sản phẩm</h2>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={qrInfo.clothingImageUrl}
                  alt="Clothing"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>

            {/* Right: Upload & Try-On */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Tải ảnh của bạn</h2>
              
              {!previewUrl ? (
                <label className="block">
                  <div className="border-4 border-dashed border-amber-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                    <PhotoIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">Chọn ảnh của bạn</p>
                    <p className="text-sm text-gray-500">Full body hoặc half body</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </label>
              ) : (
                <div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-4">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                      }}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Chọn lại
                    </button>
                    <button
                      onClick={handleTryOn}
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl font-bold text-white hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <SparklesIcon className="w-5 h-5 animate-spin" />
                          Đang xử lý...
                        </span>
                      ) : (
                        'Thử ngay!'
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-900">
                  💡 <strong>Lưu ý:</strong> Chọn ảnh rõ mặt, đứng thẳng để kết quả tốt nhất!
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Result Display */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thử đồ thành công! 🎉</h2>
            <p className="text-gray-600 mb-6">Đây là kết quả thử đồ ảo của bạn</p>

            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-6 max-w-md mx-auto">
              <Image
                src={resultImageUrl}
                alt="Result"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={downloadResult}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl font-bold text-white hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <ArrowUpTrayIcon className="w-5 h-5" />
                Tải xuống
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setResultImageUrl(null)
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Thử lại
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Powered by <span className="font-bold text-amber-600">Clothify</span>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

