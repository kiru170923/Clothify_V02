'use client'

import { useState } from 'react'
import { User, Ruler, Weight, Heart, Target } from 'lucide-react'
import { useSupabase } from './SupabaseProvider'

interface BodyInfo {
  height: number // cm
  weight: number // kg
  bodyType: string
  preferences: string[]
}

export function ProfileTab() {
  const { user } = useSupabase()
  const [bodyInfo, setBodyInfo] = useState<BodyInfo>({
    height: 170,
    weight: 65,
    bodyType: 'average',
    preferences: []
  })

  const bodyTypes = [
    { id: 'slim', label: 'Gầy' },
    { id: 'average', label: 'Trung bình' },
    { id: 'athletic', label: 'Thể thao' },
    { id: 'curvy', label: 'Đầy đặn' },
  ]

  const stylePreferences = [
    { id: 'casual', label: 'Thường ngày' },
    { id: 'formal', label: 'Công sở' },
    { id: 'sporty', label: 'Thể thao' },
    { id: 'elegant', label: 'Thanh lịch' },
    { id: 'trendy', label: 'Thời trang' },
    { id: 'vintage', label: 'Cổ điển' },
  ]

  const calculateBMI = () => {
    const heightInM = bodyInfo.height / 100
    return (bodyInfo.weight / (heightInM * heightInM)).toFixed(1)
  }

  const getRecommendations = () => {
    const bmi = parseFloat(calculateBMI())
    let recommendations = []
    
    if (bmi < 18.5) {
      recommendations = ['Áo sơ mi dài tay', 'Quần jean slim fit', 'Áo khoác bomber']
    } else if (bmi >= 18.5 && bmi < 25) {
      recommendations = ['Áo thun basic', 'Quần chinos', 'Áo khoác denim']
    } else if (bmi >= 25 && bmi < 30) {
      recommendations = ['Áo sơ mi rộng', 'Quần jogger', 'Áo khoác oversized']
    } else {
      recommendations = ['Áo polo', 'Quần cargo', 'Áo khoác dài']
    }
    
    return recommendations
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h2>
        <p className="text-gray-600 mt-2">Thông tin cơ thể và sở thích thời trang</p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {user?.user_metadata?.full_name || 'User'}
            </h3>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Body Measurements */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5" />
          Thông tin cơ thể
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chiều cao (cm)
            </label>
            <input
              type="number"
              value={bodyInfo.height}
              onChange={(e) => setBodyInfo(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
              className="input"
              min="100"
              max="250"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cân nặng (kg)
            </label>
            <input
              type="number"
              value={bodyInfo.weight}
              onChange={(e) => setBodyInfo(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
              className="input"
              min="30"
              max="200"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kiểu dáng cơ thể
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {bodyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setBodyInfo(prev => ({ ...prev, bodyType: type.id }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  bodyInfo.bodyType === type.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* BMI Display */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">BMI:</span>
            <span className="text-lg font-bold text-primary-600">{calculateBMI()}</span>
          </div>
        </div>
      </div>

      {/* Style Preferences */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Sở thích thời trang
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {stylePreferences.map((pref) => (
            <button
              key={pref.id}
              onClick={() => {
                setBodyInfo(prev => ({
                  ...prev,
                  preferences: prev.preferences.includes(pref.id)
                    ? prev.preferences.filter(p => p !== pref.id)
                    : [...prev.preferences, pref.id]
                }))
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                bodyInfo.preferences.includes(pref.id)
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pref.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Gợi ý phù hợp
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getRecommendations().map((item, index) => (
            <div key={index} className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-gray-700">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
