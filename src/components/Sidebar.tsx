'use client'

import { motion } from 'framer-motion'
import { 
  HomeIcon, 
  PhotoIcon, 
  UserIcon, 
  ClockIcon, 
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  PhotoIcon as PhotoIconSolid,
  UserIcon as UserIconSolid,
  ClockIcon as ClockIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  {
    id: 'home',
    icon: HomeIcon,
    iconActive: HomeIconSolid,
    label: 'Trang chủ'
  },
  {
    id: 'wardrobe',
    icon: PhotoIcon,
    iconActive: PhotoIconSolid,
    label: 'Tủ đồ'
  },
  {
    id: 'history',
    icon: ClockIcon,
    iconActive: ClockIconSolid,
    label: 'Lịch sử'
  },
  {
    id: 'profile',
    icon: UserIcon,
    iconActive: UserIconSolid,
    label: 'Hồ sơ'
  },
  {
    id: 'settings',
    icon: Cog6ToothIcon,
    iconActive: Cog6ToothIconSolid,
    label: 'Cài đặt'
  }
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-20 lg:w-72 bg-white border-r border-gray-100 h-screen flex flex-col sticky top-0 z-40"
    >
      {/* Logo */}
      <div className="flex items-center justify-center lg:justify-start lg:px-6 py-8">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-gray-900">Clothify</h1>
            <p className="text-xs text-gray-500">AI Virtual Try-On</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-6 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = activeTab === item.id ? item.iconActive : item.icon
          const isActive = activeTab === item.id
          
          return (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-gray-900' : ''}`} />
              <span className="hidden lg:block font-medium text-sm">
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 lg:p-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="hidden lg:block p-4 bg-gray-50 rounded-xl border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-sm text-gray-900">Pro Tips</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Sử dụng ảnh có độ phân giải cao và nền sáng để có kết quả tốt nhất
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}