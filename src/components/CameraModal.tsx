'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageDataUrl: string) => void
  type: 'person' | 'clothing'
}

export default function CameraModal({ isOpen, onClose, onCapture, type }: CameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
    
    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [isOpen])

  // Additional cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: type === 'person' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
      toast.error('Không thể truy cập camera')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        track.enabled = false
      })
      setStream(null)
    }
    
    // Clear video source and pause
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.pause()
      videoRef.current.load()
    }
  }

  const forceStopCamera = () => {
    console.log('forceStopCamera called')
    // Stop current stream first
    if (stream) {
      console.log('Stopping stream tracks')
      stream.getTracks().forEach(track => {
        track.stop()
        track.enabled = false
      })
      setStream(null)
    }
    
    // Clear video source
    if (videoRef.current) {
      console.log('Clearing video source')
      videoRef.current.srcObject = null
      videoRef.current.pause()
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    
    // Simulate capture delay
    setTimeout(() => {
      onCapture(imageDataUrl)
      setIsCapturing(false)
      onClose()
      toast.success('Chụp ảnh thành công!')
    }, 500)
  }

  const switchCamera = async () => {
    stopCamera()
    await new Promise(resolve => setTimeout(resolve, 100))
    startCamera()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={() => {
          forceStopCamera()
          onClose()
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl overflow-hidden max-w-md w-full max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Chụp ảnh {type === 'person' ? 'cá nhân' : 'trang phục'}
            </h3>
            <button
              onClick={() => {
                forceStopCamera()
                onClose()
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Camera View */}
          <div className="relative bg-black">
            {error ? (
              <div className="aspect-video flex items-center justify-center p-8">
                <div className="text-center">
                  <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={startCamera}
                    className="btn btn-primary btn-sm"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Capture overlay */}
                {isCapturing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/50 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </motion.div>
                )}

                {/* Camera controls */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={switchCamera}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <ArrowPathIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="p-4 flex gap-3">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Hủy button clicked')
                forceStopCamera()
                onClose()
              }}
              className="flex-1 btn btn-secondary"
            >
              Hủy
            </button>
            <button
              onClick={capturePhoto}
              disabled={!stream || isCapturing}
              className="flex-1 btn btn-primary"
            >
              {isCapturing ? 'Đang chụp...' : 'Chụp ảnh'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
