import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'
import { supabase } from '../lib/supabase'
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
    mutationFn: async ({ personImage, clothingImage, clothingItems, selectedGarmentType }: TryOnRequest): Promise<TryOnResponse> => {
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

      // Use single clothing image directly
      let finalClothingImage = clothingImage
      
      if (clothingItems && clothingItems.length > 0) {
        finalClothingImage = clothingItems[0].image
      } else if (false) { // Disable composite creation
        console.log('🎨 Creating clothing-only composite image...')
        console.log('Clothing items count:', clothingItems?.length || 0)
        
        try {
          // Create clothing composite image (no person)
          console.log('🎨 Creating clothing composite...')
          const testResponse = await fetch('/api/test-composite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              personImageUrl: personImage,
              clothingImageUrls: clothingItems?.map(item => item.image) || []
            })
          })
          
          const testData = await testResponse.json()
          console.log('🧪 Test composite response:', testData)
          console.log('🧪 Response status:', testResponse.status)
          
          if (testData.success && testData.compositeImage) {
            console.log('✅ Test composite successful, using it')
            console.log('✅ Composite image length:', testData.compositeImage.length)
            finalClothingImage = testData.compositeImage
            console.log('✅ Using base64 composite image directly')
          } else {
            console.log('❌ Test composite failed:', testData.error)
            console.log('❌ Test composite details:', testData)
            throw new Error(`Composite creation failed: ${testData.error || 'Unknown error'}`)
          }
        } catch (error) {
          console.error('❌ Failed to create server-side composite:', error)
          console.error('❌ Error details:', error)
          toast.error('Không thể tạo ảnh ghép - VUI LÒNG THỬ LẠI')
          throw new Error('Composite creation failed - cannot proceed without composite image')
        }
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
