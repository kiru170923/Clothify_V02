'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faEnvelope, faCalendarDays, faGear, faCrown, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { useSupabase } from './SupabaseProvider'
import { useMembership } from '../hooks/useMembership'
import { motion } from 'framer-motion'
import MembershipDetailsModal from './MembershipDetailsModal'

export const ProfileTab = React.memo(function ProfileTab() {
  const { user, signOut } = useSupabase()
  const { data: membershipData, isLoading: loadingMembership } = useMembership()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  React.useLayoutEffect(() => {
    if (isModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      document.body.classList.add('modal-open');
      document.body.classList.add('no-scroll-offset'); // Add this class
      document.documentElement.classList.add('lenis');
    } else {
      document.body.classList.remove('modal-open');
      document.body.classList.remove('no-scroll-offset'); // Remove this class
      document.documentElement.classList.remove('lenis');
      document.documentElement.style.removeProperty('--scrollbar-width');
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.body.classList.remove('no-scroll-offset'); // Remove this class
      document.documentElement.classList.remove('lenis');
      document.documentElement.style.removeProperty('--scrollbar-width');
    };
  }, [isModalOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">
          Personal Profile
        </h2>
        <p className="text-amber-600 mt-2">Account information and settings</p>
      </div>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8"
      >
        <div className="flex items-center gap-6 mb-8">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <FontAwesomeIcon icon={faUser} className="w-10 h-10 text-white" />
            )}
          </div>
          
          {/* User Details */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {user?.user_metadata?.full_name || 'Người dùng'}
            </h3>
            <p className="text-amber-600 font-medium">
              {user?.email}
            </p>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faCalendarDays} className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-sm text-amber-600 font-medium">Member since</p>
            <p className="text-lg font-bold text-amber-800">
              {user?.created_at ? formatDate(user.created_at) : 'Not specified'}
            </p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faCrown} className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm text-yellow-600 font-medium">Current Plan</p>
            <p className="text-lg font-bold text-yellow-800">
              {loadingMembership ? (
                <span className="animate-pulse">Loading...</span>
              ) : membershipData?.membership?.plan?.name || 'Free'}
            </p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faGear} className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm text-orange-600 font-medium">Status</p>
            <p className="text-lg font-bold text-orange-800">Active</p>
          </div>
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faGear} className="w-5 h-5 text-amber-600" />
          Account Settings
        </h3>

        <div className="space-y-4">
          {/* Email Settings */}
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg font-medium transition-colors text-sm">
              Change
            </button>
          </div>

          {/* Membership */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCrown} className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Membership Plan</p>
                <p className="text-sm text-gray-600">
                  {loadingMembership ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : membershipData?.membership?.plan ? (
                    `${membershipData.membership.plan.name} - ${membershipData.membership.billing_cycle === 'monthly' ? membershipData.membership.plan.tokens_monthly : membershipData.membership.plan.tokens_yearly} tokens/${membershipData.membership.billing_cycle === 'monthly' ? 'month' : 'year'}`
                  ) : (
                    'Free Plan - 10 tokens/month'
                  )}
                </p>
              </div>
            </div>
            <button 
              onClick={() => { 
                if (membershipData?.membership?.plan) {
                  setIsModalOpen(true)
                } else {
                  window.location.href = '/membership'
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-lg font-medium transition-all text-sm"
            >
              {membershipData?.membership?.plan ? 'Manage Plan' : 'Upgrade'}
            </button>
          </div>
        </div>
      </motion.div>

      <MembershipDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        membershipData={membershipData}
      />
    </div>
  )
})