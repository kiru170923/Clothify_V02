import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'
import { supabase } from '../lib/supabase'
import { parseResponseJson } from '../lib/parseResponse'
// Remove client-side composite import
import toast from 'react-hot-toast'

interface TryOnRequest {
  personImage: string
  clothingImage: string
  clothingItems?: Array<{
    id: string
    image: string
    type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
    label: string
    category?: string
    color?: string
    style?: string
    confidence?: number
  }>
  selectedGarmentType?: 'auto' | 'top' | 'bottom' | 'full-body'
  fastMode?: boolean
}

interface TryOnResponse {
  success: boolean
  resultImageUrl?: string
  taskId?: string
  error?: string
}

// Try-on mutation
export function useTryOn() {
  const { session } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ personImage, clothingImage, clothingItems, selectedGarmentType, fastMode }: TryOnRequest): Promise<TryOnResponse> => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      // First consume token
      const tokenResponse = await fetch('/api/membership/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tokensToUse: 1,
          description: 'AI Image Generation',
          imageId: null,
        }),
      })

      if (!tokenResponse.ok) {
        const tokenData = await parseResponseJson(tokenResponse)
        if (tokenData.error === 'Insufficient tokens') {
          throw new Error(`Không đủ tokens! Bạn còn ${tokenData.availableTokens} tokens.`)
        }
        throw new Error(tokenData.error || 'Failed to consume token')
      }

      // Use single clothing image directly
      let finalClothingImage = clothingImage
      
      if (clothingItems && clothingItems.length > 0) {
        finalClothingImage = clothingItems[0].image
      }

      // Then generate image
      const response = await fetch('/api/clothify/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          personImage,
          clothingImage: finalClothingImage,
          clothingImageUrls: clothingItems?.map(item => item.image) || [],
          selectedGarmentType: selectedGarmentType || 'auto',
          fastMode: !!fastMode
        }),
      })

      const data = await parseResponseJson(response)

      // If API returned error after token deduction, try to refund automatically
      if (!response.ok || (data && data.error)) {
        try {
          await fetch('/api/membership/tokens/refund', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ tokensToRefund: 1, reason: data?.error || 'Generation failed' })
          })
        } catch {}
      }

      if (response.status === 202 && data.taskId) {
        // Poll status endpoint until success/fail or timeout (~60s)
        const taskId = data.taskId as string
        const start = Date.now()
        const timeoutMs = 60000
        const pollDelay = async (attempt: number) => {
          const delay = Math.min(500 * Math.pow(1.5, Math.floor(attempt / 3)), 4000)
          await new Promise(r => setTimeout(r, delay))
        }

        let attempt = 0
        while (Date.now() - start < timeoutMs) {
          await pollDelay(attempt++)
          const statusRes = await fetch(`/api/clothify/status?taskId=${encodeURIComponent(taskId)}`, { 
            cache: 'no-store',
            headers: {
              'Authorization': `Bearer ${session.access_token}` // 🔥 Add auth header for history saving
            }
          })
          if (!statusRes.ok) continue
          const status = await parseResponseJson(statusRes)
          if (status.state === 'success' && status.resultImageUrl) {
            return { success: true, resultImageUrl: status.resultImageUrl }
          }
          if (status.state === 'failed') {
            // Auto refund token
            try {
              await fetch('/api/membership/tokens/refund', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ tokensToRefund: 1, reason: status.message || 'Generation failed' })
              })
            } catch {}
            throw new Error(status.message || 'Generation failed')
          }
        }
        // Timed out but task created
        return { success: true, taskId }
      }

      if (data.success && data.resultImageUrl) {
        return {
          success: true,
          resultImageUrl: data.resultImageUrl,
        }
      }

      // Log the actual response for debugging
      console.error('❌ API Error Response:', data)
      console.error('❌ Response status:', response.status)
      console.error('❌ Response headers:', response.headers)
      
      const errorMessage = data?.error || data?.message || 'Failed to generate image'
      console.error('❌ Error message:', errorMessage)
      
      throw new Error(errorMessage)
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate tokens to refresh balance
        queryClient.invalidateQueries({ queryKey: ['tokens'] })
        
        // Invalidate history to show new result
        queryClient.invalidateQueries({ queryKey: ['history'] })
        
        if (data.resultImageUrl) {
          toast.success('Tạo ảnh thành công!')
        } else if (data.taskId) {
          toast.success('Task đã được tạo! Đang xử lý, vui lòng chờ...')
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
