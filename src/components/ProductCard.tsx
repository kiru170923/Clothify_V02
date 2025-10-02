import React from 'react'
import { motion } from 'framer-motion'

interface ProductCardProps {
  product: {
    name: string
    price: number
    description?: string
    image?: string
    productUrl?: string
  }
  onTryOn?: (imageUrl: string) => void
  onBuy?: (url: string) => void
  tryOnLoading?: string | null
  tryOnResults?: Map<string, string>
  onImageClick?: (url: string, alt: string) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onTryOn, 
  onBuy,
  tryOnLoading,
  tryOnResults,
  onImageClick
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 max-w-sm"
    >
      <div className="flex flex-row items-start">
              {/* Image Section - 30% width */}
              {product.image && (
                <div className="w-[30%] p-2 bg-gray-50 flex-shrink-0">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-20 object-cover rounded-md shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                    onClick={() => onImageClick?.(product.image!, product.name)}
                  />
                  {/* Show try-on result if available */}
                  {tryOnResults?.has(product.image) && (
                    <div className="mt-1">
                      <img 
                        src={tryOnResults.get(product.image)} 
                        alt={`${product.name} - Thử đồ`}
                        className="w-full h-20 object-cover rounded-md shadow-sm cursor-pointer hover:opacity-80 transition-opacity border-2 border-green-400"
                        onClick={() => {
                          const resultUrl = tryOnResults.get(product.image!)
                          if (resultUrl) {
                            onImageClick?.(resultUrl, `${product.name} - Thử đồ`)
                          }
                        }}
                      />
                      <p className="text-xs text-green-600 text-center mt-1">Ảnh thử đồ</p>
                    </div>
                  )}
                </div>
              )}

        {/* Content Section - 65% width */}
        <div className="w-[65%] p-3 space-y-2">
          {/* Header with title and price */}
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
              {product.name}
            </h3>
            <p className="text-sm font-bold text-red-600">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  {product.image && onTryOn && (
                    <button 
                      onClick={() => onTryOn(product.image!)}
                      disabled={tryOnLoading === product.image}
                      className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-1.5 px-2 rounded text-xs font-medium transition-all"
                    >
                      {tryOnLoading === product.image ? 'Đang xử lý...' : 'Thử ngay'}
                    </button>
                  )}
                  {product.productUrl && onBuy && (
                    <button 
                      onClick={() => onBuy(product.productUrl!)}
                      className="flex-1 border border-gray-300 text-gray-800 py-1.5 px-2 rounded text-xs font-medium hover:bg-gray-100 transition-all"
                    >
                      Mua ngay
                    </button>
                  )}
                </div>
        </div>
      </div>
    </motion.div>
  )
}