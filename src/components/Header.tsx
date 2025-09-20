'use client'

import { motion } from 'framer-motion'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  CreditCardIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { useSupabase } from './SupabaseProvider'
import React from 'react'
import { UserTokens } from '../types/membership'
import { useTokens } from '../hooks/useTokens'
import toast from 'react-hot-toast'

export default function Header() {
  const { user, signOut } = useSupabase()
  
  // Use React Query for tokens
  const { data: tokenData, isLoading: loadingTokens, error } = useTokens()

  // Show bonus token notification for new users
  React.useEffect(() => {
    if (tokenData?.isNewUser && tokenData.bonusTokens && tokenData.bonusTokens > 0) {
      toast.success(`🎉 Chào mừng! Bạn được tặng ${tokenData.tokens.total_tokens} tokens miễn phí!`)
    }
  }, [tokenData])

  // Hiển thị total_tokens thay vì tính toán available tokens
  const displayTokens = tokenData?.tokens?.total_tokens || 0

  return (
    <header className="bg-gradient-to-r from-purple-50 via-white to-pink-50 border-b border-purple-100 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Clothify</span>
              <span className="text-xs text-purple-500 font-medium ml-2">AI Fashion Studio</span>
            </div>
          </div>
          
          {/* Quick Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <a href="/" className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-medium text-sm">
              <span>💬</span>
              <span>AI Chat</span>
              <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse"></div>
            </a>
            <a href="/try-on" className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium text-sm">Thử đồ</a>
            <a href="/wardrobe" className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium text-sm">Tủ đồ</a>
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Token Display */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                {loadingTokens ? '...' : displayTokens} tokens
              </span>
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="p-2">
                  <Menu.Item>
                    {({ active }) => (
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/profile"
                        className={`${
                          active ? 'bg-gray-50' : ''
                        } group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-700 transition-colors`}
                      >
                        <UserIcon className="w-5 h-5 text-gray-400" />
                        Hồ sơ cá nhân
                      </a>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/membership"
                        className={`${
                          active ? 'bg-gray-50' : ''
                        } group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-700 transition-colors`}
                      >
                        <CreditCardIcon className="w-5 h-5 text-gray-400" />
                        Membership
                      </a>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={async () => {
                          try {
                            await signOut()
                            toast.success('Đăng xuất thành công!')
                          } catch (error) {
                            toast.error('Lỗi đăng xuất')
                          }
                        }}
                        className={`${
                          active ? 'bg-gray-50' : ''
                        } group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-700 transition-colors`}
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                        Đăng xuất
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}