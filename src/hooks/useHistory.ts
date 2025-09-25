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
export function useHistory(page: number = 1, pageSize: number = 15) {
  const { session } = useSupabase()

  return useQuery({
    queryKey: ['history', session?.user?.id, page, pageSize],
    queryFn: async (): Promise<{ items: HistoryItem[]; page: number; pageSize: number; total: number }> => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch(`/api/clothify/history?page=${page}&pageSize=${pageSize}`, {
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
    // Optimistic update to avoid lag
    onMutate: async (id: string) => {
      const snapshot = queryClient.getQueriesData({ queryKey: ['history'] })
      queryClient.setQueriesData({ queryKey: ['history'] }, (old: any) => {
        if (!old) return old
        // Support both array of items or paginated shape
        if (Array.isArray(old)) return old.filter((it: any) => it.id !== id)
        if (old.items && Array.isArray(old.items)) {
          return { ...old, items: old.items.filter((it: any) => it.id !== id), total: Math.max(0, (old.total || 0) - 1) }
        }
        return old
      })
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      // Rollback
      context?.snapshot?.forEach(([key, data]: any) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => {
      // Gentle refetch in background
      queryClient.invalidateQueries({ queryKey: ['history'] })
    }
  })
}
