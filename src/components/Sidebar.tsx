'use client'

import { motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  PhotoIcon, 
  UserIcon, 
  ClockIcon, 
  Cog6ToothIcon,
  SparklesIcon,
  CameraIcon,
  SwatchIcon,
  CreditCardIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  PhotoIcon as PhotoIconSolid,
  UserIcon as UserIconSolid,
  ClockIcon as ClockIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  CameraIcon as CameraIconSolid,
  SwatchIcon as SwatchIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid
} from '@heroicons/react/24/solid'
import React from 'react'
import { useSidebar } from './SidebarProvider'

const menuItems = [
  {
    id: '/landing',
    icon: HomeIcon,
    iconActive: HomeIconSolid,
    label: 'Home'
  },
  {
    id: '/try-on',
    icon: CameraIcon,
    iconActive: CameraIconSolid,
    label: 'AI Try-On'
  },
  {
    id: '/wardrobe',
    icon: SwatchIcon,
    iconActive: SwatchIconSolid,
    label: 'Your Wardrobe'
  },
  {
    id: '/history',
    icon: ClockIcon,
    iconActive: ClockIconSolid,
    label: 'History'
  },
  {
    id: '/membership',
    icon: CreditCardIcon,
    iconActive: CreditCardIconSolid,
    label: 'VIP Plans'
  },
  {
    id: '/profile',
    icon: UserIcon,
    iconActive: UserIconSolid,
    label: 'Profile'
  },
  {
    id: '/admin',
    icon: ShieldCheckIcon,
    iconActive: ShieldCheckIconSolid,
    label: 'Admin'
  }
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={close}
        />
      )}

      <div
        className={`w-16 bg-gradient-to-b from-amber-50 via-white to-yellow-50 border-r border-amber-100 h-screen flex flex-col shadow-lg flex-shrink-0 z-40
        fixed left-0 top-0 transform transition-transform duration-300 md:fixed md:left-0 md:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ backgroundColor: '#f6f1e9' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-4">
          <motion.img
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            src="./favicon.ico.png"
            alt="Clothify"
            className="w-16 h-16 rounded-lg shadow-lg cursor-pointer object-cover"
            onClick={() => { router.push('/'); close() }}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = pathname === item.id ? item.iconActive : item.icon
            const isActive = pathname === item.id
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { router.push(item.id); close() }}
                className={`
                  relative w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 shadow-lg' 
                    : 'text-amber-700 hover:bg-amber-100 hover:text-amber-800'
                  }
                `}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-900' : 'group-hover:text-amber-800 text-amber-700'}`} />
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full"
                  />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              </motion.button>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 pb-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center p-2 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200"
            title="Pro Tip: Sử dụng ảnh có độ phân giải cao và nền sáng để có kết quả tốt nhất"
          >
            <SparklesIcon className="w-4 h-4 text-amber-600" />
          </motion.div>
        </div>
      </div>
    </>
  )
}