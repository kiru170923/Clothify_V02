'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

interface ImageModalProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
}

export function ImageModal({ imageUrl, isOpen, onClose }: ImageModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative w-full h-full max-w-screen max-h-screen flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full"
        >
          <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
        </button>
        
        {/* Image */}
        <img
          src={imageUrl}
          alt="Zoomed image"
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
          style={{ maxWidth: '100vw', maxHeight: '100vh' }}
        />
      </div>
    </div>
  )
}
