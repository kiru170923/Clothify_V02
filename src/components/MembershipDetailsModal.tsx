import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { MembershipResponse } from '../hooks/useMembership'
import { formatPrice } from '../types/membership'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface MembershipDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  membershipData: MembershipResponse | undefined
}

export default function MembershipDetailsModal({ isOpen, onClose, membershipData }: MembershipDetailsModalProps) {
  const membership = membershipData?.membership
  const plan = membership?.plan

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold leading-6 text-gray-900 mb-4 flex justify-between items-center"
                >
                  Membership Details
                  <button 
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </Dialog.Title>
                
                <div className="mt-2 space-y-4">
                  {membership ? (
                    <div className="space-y-3">
                      <p className="text-gray-700"><span className="font-semibold">Plan:</span> {plan?.name || 'N/A'}</p>
                      <p className="text-gray-700"><span className="font-semibold">Billing Cycle:</span> {membership.billing_cycle}</p>
                      <p className="text-gray-700"><span className="font-semibold">Start Date:</span> {formatDate(membership.start_date)}</p>
                      <p className="text-gray-700"><span className="font-semibold">End Date:</span> {formatDate(membership.end_date)}</p>
                      <p className="text-gray-700"><span className="font-semibold">Status:</span> {membership.status}</p>
                      {plan && (
                        <div className="pt-3 border-t border-gray-200 mt-4">
                          <p className="text-gray-700"><span className="font-semibold">Tokens per {membership.billing_cycle === 'monthly' ? 'month' : 'year'}:</span> {membership.billing_cycle === 'monthly' ? plan.tokens_monthly : plan.tokens_yearly}</p>
                          <p className="text-gray-700"><span className="font-semibold">Price:</span> {formatPrice(membership.billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly)} / {membership.billing_cycle === 'monthly' ? 'month' : 'year'}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">No active membership found.</p>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Got it, thanks!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
