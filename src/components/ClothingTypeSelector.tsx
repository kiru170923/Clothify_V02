'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ClothingTypeSelectorProps {
  onTypeChange: (type: 'top' | 'bottom' | 'dress' | 'outerwear') => void
  selectedType: string | null
}

const clothingTypes = [
  { id: 'top', label: 'Áo/Shirt', icon: '👕', description: 'Áo sơ mi, áo phông, áo tank...' },
  { id: 'bottom', label: 'Quần/Short', icon: '👖', description: 'Quần dài, quần short, váy...' },
  { id: 'dress', label: 'Đầm/Váy', icon: '👗', description: 'Đầm, váy liền thân...' },
  { id: 'outerwear', label: 'Áo khoác', icon: '🧥', description: 'Áo khoác, blazer, hoodie...' }
]

export default function ClothingTypeSelector({ onTypeChange, selectedType }: ClothingTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Loại trang phục:</h3>
      <div className="grid grid-cols-2 gap-2">
        {clothingTypes.map((type) => (
          <motion.button
            key={type.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTypeChange(type.id as any)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedType === type.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-xs font-medium">{type.label}</div>
              <div className="text-xs text-gray-500 mt-1">{type.description}</div>
            </div>
          </motion.button>
        ))}
      </div>
      
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-xs text-blue-700">
            💡 <strong>Mẹo:</strong> Chọn đúng loại trang phục sẽ giúp AI xử lý chính xác hơn và loại bỏ hoàn toàn trang phục cũ.
          </p>
        </motion.div>
      )}
    </div>
  )
}
