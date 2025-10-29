'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { QrCodeIcon } from '@heroicons/react/24/outline'
import { QRCodeCanvas } from 'qrcode.react'
import { exportQRCode } from '../lib/qrExporter'

interface QRGenerateButtonProps {
  clothingImageUrl: string
  wardrobeItemId?: string
  productName: string
  onSuccess?: (qrCode: string) => void
}

export default function QRGenerateButton({ 
  clothingImageUrl, 
  wardrobeItemId,
  productName,
  onSuccess 
}: QRGenerateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [qrData, setQrData] = useState<{
    code: string
    publicUrl: string
    name: string
  } | null>(null)

  const generateQR = async () => {
    try {
      setLoading(true)
      toast.loading('Đang tạo QR code...', { id: 'gen-qr' })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Vui lòng đăng nhập', { id: 'gen-qr' })
        return
      }

      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clothingImageUrl,
          wardrobeItemId: wardrobeItemId || null,
          name: productName || 'QR Code'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create QR')
      }

      setQrData({
        code: data.qrCode.code,
        publicUrl: data.qrCode.publicUrl,
        name: data.qrCode.name
      })
      setShowModal(true)
      toast.success('QR code đã được tạo!', { id: 'gen-qr' })
      
      if (onSuccess) {
        onSuccess(data.qrCode.code)
      }

    } catch (error: any) {
      console.error('QR generation error:', error)
      toast.error(error.message || 'Có lỗi xảy ra', { id: 'gen-qr' })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'plain' | 'branded-simple' | 'branded-full') => {
    if (!qrData) return

    try {
      toast.loading('Đang xuất QR...', { id: 'export' })
      
      await exportQRCode({
        qrCode: qrData.publicUrl,
        clothingImageUrl,
        format,
        fileName: `clothify-qr-${qrData.code}-${format}.png`
      })

      toast.success('Đã tải xuống QR!', { id: 'export' })
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Có lỗi khi xuất QR', { id: 'export' })
    }
  }

  return (
    <>
      <button
        onClick={generateQR}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
      >
        <QrCodeIcon className="w-5 h-5" />
        {loading ? 'Đang tạo...' : 'Tạo QR'}
      </button>

      {/* QR Modal */}
      {showModal && qrData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">QR Code đã được tạo! 🎉</h3>
            
            {/* QR Preview */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl mb-4 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <QRCodeCanvas
                  value={qrData.publicUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            </div>

            {/* URL */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-1 block">Public URL</label>
              <input
                type="text"
                value={qrData.publicUrl}
                readOnly
                onClick={(e) => {
                  e.currentTarget.select()
                  navigator.clipboard.writeText(qrData.publicUrl)
                  toast.success('Đã copy URL!')
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm cursor-pointer"
              />
            </div>

            {/* Export Options */}
            <div className="space-y-2 mb-4">
              <p className="text-sm font-bold text-gray-700">Tải xuống:</p>
              <button
                onClick={() => handleExport('plain')}
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm text-left"
              >
                📱 QR đơn giản (512x512px)
              </button>
              <button
                onClick={() => handleExport('branded-simple')}
                className="w-full px-4 py-2 bg-blue-50 border border-blue-300 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors text-sm text-left"
              >
                🖼️ QR + Ảnh sản phẩm
              </button>
              <button
                onClick={() => handleExport('branded-full')}
                className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all text-sm text-left font-medium"
              >
                ⭐ Full Branding (1080x1080px)
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  window.open('/qr-codes', '_blank')
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-all"
              >
                Quản lý QRs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

