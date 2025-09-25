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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoins, faUser, faCreditCard, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { useSupabase } from './SupabaseProvider'
import React from 'react'
import Link from 'next/link'
import { UserTokens } from '../types/membership'
import { useTokens } from '../hooks/useTokens'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useSidebar } from './SidebarProvider'

export default function Header() {
  const { user, signOut } = useSupabase()
  const router = useRouter()
  const { toggle } = useSidebar()
  
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
    <header className="bg-gradient-to-r from-amber-50 via-white to-yellow-50 border-b border-amber-100 px-6 py-4 shadow-lg" style={{ backgroundColor: '#f6f1e9' }}>
      <div className="flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={toggle}
              className="md:hidden mr-2 p-2 rounded-lg border border-amber-200 bg-white/70 text-amber-700 hover:bg-white"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">Clothify</span>
              <span className="text-xs text-amber-600 font-medium ml-2">AI Fashion Studio</span>
            </div>
          </div>
          
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Token Display */}
          {user && (
            <button onClick={()=>router.push('/tokens/buy')} title="Buy tokens" className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg hover:shadow">
              <FontAwesomeIcon icon={faCoins} className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {loadingTokens ? '...' : displayTokens}
              </span>
            </button>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200">
            <BellIcon className="w-6 h-6 text-amber-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || 'User'}
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
                      </div>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/profile"
                        className={`${
                          active ? 'bg-amber-50' : ''
                        } group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-amber-700 transition-colors`}
                      >
                        <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-amber-500" />
                        Personal Profile
                      </Link>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/onboarding"
                        className={`${
                          active ? 'bg-amber-50' : ''
                        } group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-amber-700 transition-colors`}
                      >
                        <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-amber-500" />
                        View/Edit Style Profile
                      </a>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/membership"
                        className={`${
                          active ? 'bg-amber-50' : ''
                        } group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-amber-700 transition-colors`}
                      >
                        <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-amber-500" />
                        Membership
                      </Link>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={async () => {
                          try {
                            await signOut()
                            toast.success('Logged out successfully!')
                            router.push('/landing')
                          } catch (error) {
                            toast.error('Logout error')
                          }
                        }}
                        className={`${
                          active ? 'bg-amber-50' : ''
                        } group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-amber-700 transition-colors`}
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} className="w-5 h-5 text-amber-500" />
                        Logout
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