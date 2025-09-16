import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface TryOnRequest {
  personImage: string
  clothingImage: string
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
    mutationFn: async ({ personImage, clothingImage }: TryOnRequest): Promise<TryOnResponse> => {
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
        const tokenData = await tokenResponse.json()
        if (tokenData.error === 'Insufficient tokens') {
          throw new Error(`Không đủ tokens! Bạn còn ${tokenData.availableTokens} tokens.`)
        }
        throw new Error(tokenData.error || 'Failed to consume token')
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
          clothingImage,
        }),
      })

      const data = await response.json()

      if (response.status === 202) {
        // Task is processing
        return {
          success: true,
          taskId: data.taskId,
        }
      }

      if (data.success && data.resultImageUrl) {
        return {
          success: true,
          resultImageUrl: data.resultImageUrl,
        }
      }

      // Log the actual response for debugging
      console.error('API Response:', data)
      throw new Error(data.error || 'Failed to generate image')
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
