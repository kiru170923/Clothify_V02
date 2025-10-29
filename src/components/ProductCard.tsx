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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm rounded-xl border border-amber-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Image Top */}
      <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50">
        <div className="aspect-[4/3] w-full overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
              onClick={() => onImageClick?.(product.image!, product.name)}
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden'
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Không có ảnh</div>
          )}
        </div>

        {/* Try-on badge */}
        {product.image && tryOnResults?.has(product.image) && (
          <button
            className="absolute bottom-2 left-2 rounded-full bg-green-600 text-white text-[10px] px-2 py-1 shadow hover:bg-green-700"
            onClick={() => {
              const resultUrl = tryOnResults.get(product.image!)
              if (resultUrl) onImageClick?.(resultUrl, `${product.name} - Thử đồ`)
            }}
            title="Xem ảnh thử đồ"
          >
            Ảnh thử đồ
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {product.name}
          </h3>
          <div className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            {formatPrice(product.price)}
          </div>
        </div>

        {product.description && (
          <p className="mt-1 text-xs text-gray-600 leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          {product.image && onTryOn && (
            <button
              onClick={() => onTryOn(product.image!)}
              disabled={tryOnLoading === product.image}
              className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-medium py-1.5 px-3 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 transition-all"
            >
              {tryOnLoading === product.image ? 'Đang xử lý...' : 'Thử ngay'}
            </button>
          )}
          {product.productUrl && onBuy && (
            <button
              onClick={() => onBuy(product.productUrl!)}
              className="flex-1 rounded-lg border border-amber-200 text-amber-800 text-xs font-medium py-1.5 px-3 hover:bg-amber-50 transition-colors"
            >
              Mua ngay
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}