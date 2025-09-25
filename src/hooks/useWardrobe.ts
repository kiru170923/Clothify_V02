import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'

export interface WardrobeItem {
  id: string
  image_url: string
  name: string
  category: string
  created_at: string
}

export function useWardrobe(page: number = 1, pageSize: number = 20) {
  const { session } = useSupabase()
  return useQuery({
    queryKey: ['wardrobe', session?.user?.id, page, pageSize],
    queryFn: async (): Promise<{ items: WardrobeItem[]; page: number; pageSize: number; total: number }> => {
      const res = await fetch(`/api/wardrobe?page=${page}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch wardrobe')
      return res.json()
    },
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  })
}

export function useDeleteWardrobe() {
  const { session } = useSupabase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wardrobe?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!res.ok) throw new Error('Failed to delete wardrobe item')
      return res.json()
    },
    onMutate: async (id: string) => {
      const snapshot = queryClient.getQueriesData({ queryKey: ['wardrobe'] })
      queryClient.setQueriesData({ queryKey: ['wardrobe'] }, (old: any) => {
        if (!old) return old
        if (Array.isArray(old)) return old.filter((it: any) => it.id !== id)
        if (old.items) return { ...old, items: old.items.filter((it: any) => it.id !== id), total: Math.max(0, (old.total || 0) - 1) }
        return old
      })
      return { snapshot }
    },
    onError: (_err, _id, ctx: any) => {
      ctx?.snapshot?.forEach(([key, data]: any) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] })
    },
  })
}


