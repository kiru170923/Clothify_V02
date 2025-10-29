'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { 
  QrCodeIcon, 
  PlusIcon, 
  EyeIcon, 
  EyeSlashIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { QRCodeCanvas } from 'qrcode.react'
import { exportQRCode } from '../../lib/qrExporter'

interface QRCodeData {
  id: string
  code: string
  name: string
  clothingImageUrl: string
  publicUrl: string
  totalScans: number
  successfulTryons: number
  tokensSpent: number
  successRate: number
  isActive: boolean
  status: string
  maxUses?: number
  expiresAt?: string
  createdAt: string
  lastScannedAt?: string
}

export default function QRCodesPage() {
  const router = useRouter()
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchQRCodes()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    }
  }

  const fetchQRCodes = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const res = await fetch('/api/qr/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await res.json()

      if (res.ok) {
        setQrCodes(data.qrCodes || [])
      } else {
        toast.error('Failed to load QR codes')
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error)
      toast.error('Error loading QR codes')
    } finally {
      setLoading(false)
    }
  }

  const toggleQRStatus = async (code: string, currentStatus: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/qr/${code}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (res.ok) {
        toast.success(currentStatus ? 'QR đã bị vô hiệu hóa' : 'QR đã được kích hoạt')
        fetchQRCodes()
      } else {
        toast.error('Failed to update QR status')
      }
    } catch (error) {
      console.error('Error toggling QR:', error)
      toast.error('Error updating QR')
    }
  }

  const deleteQR = async (code: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa QR "${name}"?`)) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/qr/${code}/status`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (res.ok) {
        toast.success('QR đã được xóa')
        fetchQRCodes()
      } else {
        toast.error('Failed to delete QR')
      }
    } catch (error) {
      console.error('Error deleting QR:', error)
      toast.error('Error deleting QR')
    }
  }

  const showQRCodeModal = (qr: QRCodeData) => {
    setSelectedQR(qr)
    setShowQRModal(true)
  }

  const downloadQR = async (qr: QRCodeData, format: 'plain' | 'branded-simple' | 'branded-full' = 'plain') => {
    try {
      toast.loading('Đang tạo QR code...', { id: 'export-qr' })
      
      await exportQRCode({
        qrCode: qr.publicUrl,
        clothingImageUrl: qr.clothingImageUrl,
        format,
        size: format === 'plain' ? 512 : format === 'branded-simple' ? 256 : 300,
        fileName: `clothify-qr-${qr.code}-${format}.png`
      })

      toast.success('QR code đã được tải xuống!', { id: 'export-qr' })
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Có lỗi khi xuất QR code', { id: 'export-qr' })
    }
  }
  
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QR Codes</h1>
              <p className="text-gray-600 mt-1">Quản lý mã QR thử đồ ảo của bạn</p>
            </div>
            <button
              onClick={() => router.push('/qr-codes/new')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:from-amber-600 hover:to-yellow-600 hover:shadow-xl transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Tạo QR mới
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <SparklesIcon className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Đang tải...</p>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-12">
            <QrCodeIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có QR code nào</h3>
            <p className="text-gray-600 mb-6">Tạo QR code đầu tiên để bắt đầu!</p>
            <button
              onClick={() => router.push('/qr-codes/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:from-amber-600 hover:to-yellow-600 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Tạo QR đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr) => (
              <motion.div
                key={qr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-amber-100 overflow-hidden"
              >
                {/* QR Preview */}
                <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <QRCodeCanvas
                      id={`qr-${qr.code}`}
                      value={qr.publicUrl}
                      size={150}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{qr.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{qr.code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      qr.status === 'active' ? 'bg-green-100 text-green-800' :
                      qr.status === 'expired' ? 'bg-red-100 text-red-800' :
                      qr.status === 'max_uses_reached' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {qr.status === 'active' ? '🟢 Active' :
                       qr.status === 'expired' ? '🔴 Expired' :
                       qr.status === 'max_uses_reached' ? '🟠 Max Uses' :
                       '⚫ Disabled'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{qr.totalScans}</div>
                      <div className="text-xs text-gray-600">Scans</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{qr.successfulTryons}</div>
                      <div className="text-xs text-gray-600">Success</div>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <div className="text-lg font-bold text-amber-600">{qr.tokensSpent}</div>
                      <div className="text-xs text-gray-600">Tokens</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => showQRCodeModal(qr)}
                      className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors text-sm"
                      title="View Details"
                    >
                      📋 Chi tiết
                    </button>
                    <button
                      onClick={() => toggleQRStatus(qr.code, qr.isActive)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                        qr.isActive 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={qr.isActive ? 'Disable' : 'Enable'}
                    >
                      {qr.isActive ? <EyeSlashIcon className="w-4 h-4 mx-auto" /> : <EyeIcon className="w-4 h-4 mx-auto" />}
                    </button>
                    <button
                      onClick={() => deleteQR(qr.code, qr.name)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* QR Detail Modal */}
      {showQRModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{selectedQR.name}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: QR Code */}
              <div>
                <div className="bg-white p-6 rounded-xl border-4 border-amber-200 mb-4 flex items-center justify-center">
                  <QRCodeCanvas
                    value={selectedQR.publicUrl}
                    size={250}
                    level="H"
                    includeMargin
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-700">Tải xuống QR:</p>
                  <button
                    onClick={() => downloadQR(selectedQR, 'plain')}
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-all text-left"
                  >
                    <div className="font-bold">📱 QR Đơn giản</div>
                    <div className="text-xs text-gray-600">Chỉ mã QR (512x512px)</div>
                  </button>
                  <button
                    onClick={() => downloadQR(selectedQR, 'branded-simple')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all text-left shadow-lg"
                  >
                    <div className="font-bold">🖼️ QR + Ảnh sản phẩm</div>
                    <div className="text-xs text-amber-100">QR ở góc ảnh + branding</div>
                  </button>
                </div>
              </div>

              {/* Right: Details */}
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Public URL</label>
                    <input
                      type="text"
                      value={selectedQR.publicUrl}
                      readOnly
                      className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                      onClick={(e) => {
                        e.currentTarget.select()
                        navigator.clipboard.writeText(selectedQR.publicUrl)
                        toast.success('Đã copy URL!')
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedQR.totalScans}</div>
                      <div className="text-xs text-gray-600">Total Scans</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedQR.successfulTryons}</div>
                      <div className="text-xs text-gray-600">Successful</div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">{selectedQR.tokensSpent}</div>
                      <div className="text-xs text-gray-600">Tokens Spent</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{selectedQR.successRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Tạo: {new Date(selectedQR.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    {selectedQR.lastScannedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Scan cuối: {new Date(selectedQR.lastScannedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="mt-6 w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

