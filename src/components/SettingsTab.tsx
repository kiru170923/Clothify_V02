'use client'

import React, { useState } from 'react'
import { Settings, Bell, Shield, Palette, Globe, Download, Trash2 } from 'lucide-react'
import { useSupabase } from './SupabaseProvider'

export const SettingsTab = React.memo(function SettingsTab() {
  const { signOut } = useSupabase()
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    darkMode: false,
    language: 'vi',
    autoSave: true,
    imageQuality: 'high',
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleExportData = () => {
    // TODO: Export user data
    alert('Tính năng xuất dữ liệu sẽ được phát triển')
  }

  const handleDeleteAccount = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      // TODO: Delete account
      alert('Tính năng xóa tài khoản sẽ được phát triển')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Cài đặt</h2>
        <p className="text-gray-600 mt-2">Quản lý tài khoản và tùy chọn ứng dụng</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Thông báo
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Thông báo push</h4>
              <p className="text-sm text-gray-500">Nhận thông báo khi có kết quả mới</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email cập nhật</h4>
              <p className="text-sm text-gray-500">Nhận email về tính năng mới</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailUpdates}
                onChange={(e) => handleSettingChange('emailUpdates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Giao diện
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Chế độ tối</h4>
              <p className="text-sm text-gray-500">Chuyển sang giao diện tối</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngôn ngữ
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="input"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Dữ liệu & Quyền riêng tư
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Tự động lưu</h4>
              <p className="text-sm text-gray-500">Tự động lưu ảnh vào lịch sử</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chất lượng ảnh
            </label>
            <select
              value={settings.imageQuality}
              onChange={(e) => handleSettingChange('imageQuality', e.target.value)}
              className="input"
            >
              <option value="low">Thấp (nhanh)</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao (chậm)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Tài khoản
        </h3>
        
        <div className="space-y-4">
          <button
            onClick={handleExportData}
            className="w-full flex items-center gap-3 p-4 text-left text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Xuất dữ liệu</h4>
              <p className="text-sm text-gray-500">Tải xuống tất cả dữ liệu của bạn</p>
            </div>
          </button>
          
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 p-4 text-left text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Globe className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Đăng xuất</h4>
              <p className="text-sm text-gray-500">Đăng xuất khỏi tài khoản</p>
            </div>
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center gap-3 p-4 text-left text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Xóa tài khoản</h4>
              <p className="text-sm text-red-500">Xóa vĩnh viễn tài khoản và dữ liệu</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
})
