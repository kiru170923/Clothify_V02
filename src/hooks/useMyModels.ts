import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'
import toast from 'react-hot-toast'

export interface ClothingClassification {
  category: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessories' | 'outerwear'
  subcategory: string
  color: string
  style: string
  season: string
  gender: string
  confidence: number
  description: string
}

export interface UserModel {
  id: string
  user_id: string
  image_url: string
  prompt: string
  style: string
  generated_at: string
  created_at: string
  updated_at: string
}

interface MyModelsResponse {
  success: boolean
  models: UserModel[]
  error?: string
}

interface UploadModelRequest {
  imageUrl: string
  name?: string
}

interface UploadModelResponse {
  success: boolean
  model: UserModel
  error?: string
}

export function useMyModels() {
  const { session } = useSupabase()
  const queryClient = useQueryClient()

  // Fetch user's models
  const modelsQuery = useQuery<MyModelsResponse, Error>({
    queryKey: ['my-models', session?.user?.id],
    queryFn: async (): Promise<MyModelsResponse> => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch('/api/my-models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch models')
      }

      return data
    },
    enabled: !!session?.access_token,
  })

  // Upload model mutation
  const uploadModelMutation = useMutation<UploadModelResponse, Error, UploadModelRequest>({
    mutationFn: async ({ imageUrl, name = 'Custom Model' }: UploadModelRequest): Promise<UploadModelResponse> => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch('/api/my-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageUrl,
          name
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload model')
      }

      return data
    },
    onSuccess: () => {
      console.log('✅ Model uploaded successfully')
      toast.success('📤 Model đã được lưu vào My Models!')
      console.log('🔄 Invalidating my-models query...')
      queryClient.invalidateQueries({ queryKey: ['my-models'] })
    },
    onError: (error) => {
      console.error('❌ Upload Model Error:', error)
      toast.error(`Lỗi upload model: ${error.message}`)
    }
  })

  // Delete model mutation
  const deleteModelMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (modelId: string): Promise<{ success: boolean }> => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch('/api/my-models', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          modelId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete model')
      }

      return data
    },
    onSuccess: () => {
      console.log('✅ Model deleted successfully')
      toast.success('🗑️ Model đã được xóa!')
      queryClient.invalidateQueries({ queryKey: ['my-models'] })
    },
    onError: (error) => {
      console.error('❌ Delete Model Error:', error)
      toast.error(`Lỗi xóa model: ${error.message}`)
    }
  })

  return {
    models: modelsQuery.data?.models || [],
    isLoading: modelsQuery.isLoading,
    error: modelsQuery.error,
    refetch: modelsQuery.refetch,
    uploadModel: uploadModelMutation.mutateAsync,
    isUploading: uploadModelMutation.isPending,
    deleteModel: deleteModelMutation.mutateAsync,
    isDeleting: deleteModelMutation.isPending,
  }
}
