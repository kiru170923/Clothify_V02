import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'

interface HistoryItem {
  id: string
  person_image_url: string
  clothing_image_url: string
  result_image_url: string
  created_at: string
  processing_time?: number
}

// Fetch history data
export function useHistory() {
  const { session } = useSupabase()

  return useQuery({
    queryKey: ['history', session?.user?.id],
    queryFn: async (): Promise<HistoryItem[]> => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch('/api/clothify/history', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      return response.json()
    },
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Delete history item
export function useDeleteHistory() {
  const { session } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch('/api/clothify/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch history
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })
}
