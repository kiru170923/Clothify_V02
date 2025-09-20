import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'
import toast from 'react-hot-toast'

interface GenerateModelRequest {
  gender: 'female' | 'male'
  customPrompt?: string
}

interface GenerateModelResponse {
  success: boolean
  modelImageUrl?: string
  taskId?: string
  savedModel?: any
  error?: string
}

export function useGenerateModel() {
  const { session } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation<GenerateModelResponse, Error, GenerateModelRequest>({
    mutationFn: async ({ gender, customPrompt }: GenerateModelRequest): Promise<GenerateModelResponse> => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      console.log('🎨 Generating AI model:', gender, customPrompt ? 'with custom prompt' : 'with default prompt')

      const response = await fetch('/api/generate-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          gender,
          customPrompt
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate model')
      }

      return data
    },
    onSuccess: (data) => {
      console.log('✅ Model generated successfully:', data)
      toast.success('🎨 AI Model đã được tạo thành công!')
      console.log('🔄 Invalidating my-models query...')
      queryClient.invalidateQueries({ queryKey: ['my-models'] })
    },
    onError: (error) => {
      console.error('❌ Generate Model Error:', error)
      toast.error(`Lỗi tạo model: ${error.message}`)
    }
  })
}
