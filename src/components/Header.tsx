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
import { useState, useEffect } from 'react'
import { UserTokens } from '../types/membership'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Header() {
  const { user, signOut } = useSupabase()
  const [userTokens, setUserTokens] = useState<UserTokens | null>(null)
  const [loadingTokens, setLoadingTokens] = useState(false)

  // Fetch user tokens
  const fetchUserTokens = async () => {
    if (!user) return
    
    setLoadingTokens(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/membership/tokens', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserTokens(data.tokens)
        
        // Show bonus token notification for new users
        if (data.isNewUser && data.bonusTokens > 0) {
          toast.success(`🎉 Chào mừng! Bạn được tặng ${data.tokens.total_tokens} tokens miễn phí!`)
        } else if (data.isNewUser) {
          toast.success(`🎉 Chào mừng! Bạn được tặng ${data.tokens.total_tokens} tokens miễn phí!`)
        }
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error)
    } finally {
      setLoadingTokens(false)
    }
  }

  useEffect(() => {
    fetchUserTokens()
  }, [user])

  const availableTokens = userTokens ? userTokens.total_tokens - userTokens.used_tokens : 0

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-100 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Search and breadcrumb area - simplified */}
        <div className="flex-1">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 text-sm text-gray-500"
          >
            <span className="font-medium text-gray-900">Clothify</span>
            <span>/</span>
            <span>Thử đồ AI</span>
          </motion.div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Token Display */}
          {user && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                {loadingTokens ? '...' : availableTokens} tokens
              </span>
              {availableTokens <= 5 && (
                <span className="text-xs text-orange-600 font-medium">(Sắp hết)</span>
              )}
            </motion.div>
          )}

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200"
          >
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </motion.button>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button as={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
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
                        onClick={signOut}
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
    </motion.header>
  )
}