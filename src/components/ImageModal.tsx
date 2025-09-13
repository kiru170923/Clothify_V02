'use client'

import { X } from 'lucide-react'

interface ImageModalProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
  title?: string
}

export function ImageModal({ imageUrl, isOpen, onClose, title }: ImageModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative w-full h-full max-w-screen max-h-screen flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Image */}
        <img
          src={imageUrl}
          alt={title || 'Image'}
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
          style={{ maxWidth: '100vw', maxHeight: '100vh' }}
        />
        
        {/* Title */}
        {title && (
          <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
            <p className="text-center font-medium">{title}</p>
          </div>
        )}
      </div>
    </div>
  )
}
