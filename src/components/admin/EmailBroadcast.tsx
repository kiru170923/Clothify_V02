'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

export default function EmailBroadcast() {
  const [sending, setSending] = useState(false)
  const [testMode, setTestMode] = useState(true)
  const [results, setResults] = useState<any>(null)

  const sendEmails = async () => {
    try {
      setSending(true)
      setResults(null)

      const confirmMessage = testMode
        ? 'Gửi email TEST đến 5 users đầu tiên?'
        : '⚠️ CẢNH BÁO: Gửi email đến TẤT CẢ users? Action này không thể hoàn tác!'

      if (!confirm(confirmMessage)) {
        setSending(false)
        return
      }

      toast.loading(testMode ? 'Đang gửi test emails...' : 'Đang gửi emails...', { id: 'email' })

      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        toast.error('Not authenticated', { id: 'email' })
        return
      }

      const url = `/api/admin/send-qr-announcement${testMode ? '?test=true' : ''}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`
        }
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send emails', { id: 'email' })
        return
      }

      setResults(data.stats)
      toast.success(data.message, { id: 'email' })

    } catch (error) {
      console.error('Error sending emails:', error)
      toast.error('Error sending emails', { id: 'email' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <EnvelopeIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Email Broadcast</h2>
          <p className="text-sm text-gray-600">Gửi thông báo QR Feature đến users</p>
        </div>
      </div>

      {/* Preview Email */}
      <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <h3 className="font-bold text-purple-900 mb-2">📧 Email Preview</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Subject:</strong> ✨ Tính năng mới: QR Code Thử Đồ Ảo - Clothify</p>
          <p><strong>From:</strong> Clothify &lt;noreply@clothify.top&gt;</p>
          <p><strong>Template:</strong> HTML + Text (responsive, branded)</p>
        </div>
        <div className="mt-3 flex gap-2">
          <a 
            href="/api/admin/send-qr-announcement/preview" 
            target="_blank"
            className="text-xs text-purple-600 hover:underline font-medium"
          >
            → Xem HTML preview
          </a>
        </div>
      </div>

      {/* Test Mode Toggle */}
      <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="w-5 h-5 text-yellow-600 rounded"
          />
          <div>
            <div className="font-bold text-yellow-900">Test Mode</div>
            <div className="text-sm text-yellow-700">
              {testMode 
                ? '✅ Chỉ gửi đến 5 users đầu tiên (recommended trước khi gửi production)'
                : '⚠️ GỬI ĐẾN TẤT CẢ USERS - Cẩn thận!'}
            </div>
          </div>
        </label>
      </div>

      {/* Action Button */}
      <button
        onClick={sendEmails}
        disabled={sending}
        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
          testMode
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {sending ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang gửi...
          </span>
        ) : testMode ? (
          '📧 Gửi Test Email (5 users)'
        ) : (
          '🚀 Gửi Email Cho Tất Cả Users'
        )}
      </button>

      {/* Results */}
      {results && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">📊 Kết quả</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{results.totalUsers}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                <CheckCircleIcon className="w-6 h-6" />
                {results.successCount}
              </div>
              <div className="text-xs text-green-700">Success</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                <XCircleIcon className="w-6 h-6" />
                {results.failedCount}
              </div>
              <div className="text-xs text-red-700">Failed</div>
            </div>
          </div>
          {results.testMode && (
            <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded text-center font-medium">
              ⚠️ Test mode - Chỉ gửi đến 5 users
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-bold text-blue-900 text-sm mb-2">ℹ️ Thông tin quan trọng</h4>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>Email được gửi qua Resend (100 emails/day free tier)</li>
          <li>Rate limit: 1 email/giây để tránh spam</li>
          <li>Auto-skip test/fake emails</li>
          <li>Luôn chạy TEST MODE trước khi gửi production</li>
          <li>Kiểm tra Resend Dashboard để xem logs: resend.com/emails</li>
        </ul>
      </div>
    </div>
  )
}

