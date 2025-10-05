'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  EyeIcon,
  ShoppingCartIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface Product {
  id: number
  name: string
  price: number
  images?: string[]
  productUrl?: string
  whyRecommend?: string
}

interface ProductCarouselProps {
  products: Product[]
  onTryOn?: (imageUrl: string) => void
  onBuy?: (url: string) => void
  onImageClick?: (url: string, alt: string) => void
  tryOnLoading?: string | null
  tryOnResults?: any
  title?: string
  maxItems?: number
}

export default function ProductCarousel({
  products,
  onTryOn,
  onBuy,
  onImageClick,
  tryOnLoading,
  tryOnResults,
  title = "Sản phẩm gợi ý",
  maxItems = 6
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  const formatPrice = (price: number | string) => {
    const numeric = typeof price === 'number' ? price : Number(String(price).replace(/[^0-9]/g, ''))
    if (!Number.isFinite(numeric)) return String(price)
    return `${new Intl.NumberFormat('vi-VN').format(numeric)}₫`
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(products.length - 1, prev + 1))
  }

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
      } else {
        newFavorites.add(productId)
      }
      return newFavorites
    })
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + maxItems)

  if (products.length === 0) return null

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {Math.ceil(products.length / maxItems)}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex >= products.length - maxItems}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {visibleProducts.map((product, index) => (
            <motion.div
              key={`${product.id}-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                {product.images?.[0] ? (
                  <motion.img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onClick={() => onImageClick?.(product.images![0], product.name)}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Không có ảnh</span>
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => onImageClick?.(product.images![0], product.name)}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <EyeIcon className="w-4 h-4 text-gray-700" />
                    </motion.button>
                    <motion.button
                      onClick={() => toggleFavorite(product.id)}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {favorites.has(product.id) ? (
                        <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4 text-gray-700" />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Try-on Loading Overlay */}
                {tryOnLoading === product.images?.[0] && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span className="text-sm">Đang thử...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3">
                <div className="min-h-[40px]">
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                <p className="text-lg font-bold text-red-600">
                  {formatPrice(product.price)}
                </p>

                {product.whyRecommend && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {product.whyRecommend}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => onTryOn?.(product.images?.[0] || '')}
                    disabled={!product.images?.[0] || tryOnLoading === product.images[0]}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tryOnLoading === product.images?.[0] ? (
                      <>
                        <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                        Thử...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Thử ngay
                      </>
                    )}
                  </motion.button>

                  {product.productUrl && (
                    <motion.button
                      onClick={() => onBuy?.(product.productUrl!)}
                      className="flex-1 border border-gray-300 text-gray-800 py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-100 transition-all flex items-center justify-center gap-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ShoppingCartIcon className="w-3 h-3" />
                      Mua ngay
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      {products.length > maxItems && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: Math.ceil(products.length / maxItems) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === Math.floor(currentIndex / maxItems)
                  ? 'bg-amber-500 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Compact version for smaller spaces
export function ProductCarouselCompact({
  products,
  onTryOn,
  onBuy,
  onImageClick,
  tryOnLoading,
  maxItems = 3
}: Omit<ProductCarouselProps, 'title'>) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const formatPrice = (price: number | string) => {
    const numeric = typeof price === 'number' ? price : Number(String(price).replace(/[^0-9]/g, ''))
    if (!Number.isFinite(numeric)) return String(price)
    return `${new Intl.NumberFormat('vi-VN').format(numeric)}₫`
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + maxItems)

  if (products.length === 0) return null

  return (
    <div className="w-full">
      {/* Compact Products */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {visibleProducts.map((product, index) => (
          <motion.div
            key={`${product.id}-${currentIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex-shrink-0 w-48 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onClick={() => onImageClick?.(product.images![0], product.name)}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <h3 className="text-xs font-semibold text-gray-900 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-sm font-bold text-red-600">
                {formatPrice(product.price)}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => onTryOn?.(product.images?.[0] || '')}
                  disabled={!product.images?.[0] || tryOnLoading === product.images[0]}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white py-1 px-2 rounded text-xs font-medium transition-all"
                >
                  Thử
                </button>
                {product.productUrl && (
                  <button
                    onClick={() => onBuy?.(product.productUrl!)}
                    className="flex-1 border border-gray-300 text-gray-800 py-1 px-2 rounded text-xs font-medium hover:bg-gray-100 transition-all"
                  >
                    Mua
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
