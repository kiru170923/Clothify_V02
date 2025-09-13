'use client'

import { motion } from 'framer-motion'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { 
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useSupabase } from './SupabaseProvider'

export default function Header() {
  const { user, signOut } = useSupabase()

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