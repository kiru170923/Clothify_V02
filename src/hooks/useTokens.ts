import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'
import { supabase } from '../lib/supabase'

interface UserTokens {
  total_tokens: number
  used_tokens: number
}

interface TokenResponse {
  tokens: UserTokens
  isNewUser?: boolean
  bonusTokens?: number
}

// Fetch user tokens
export function useTokens() {
  const { user } = useSupabase()

  return useQuery({
    queryKey: ['tokens', user?.id],
    queryFn: async (): Promise<TokenResponse> => {
      if (!user) {
        throw new Error('No user')
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch('/api/membership/tokens', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tokens')
      }

      return response.json()
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds - tokens change frequently
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Consume tokens
export function useConsumeTokens() {
  const { session } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tokensToUse, description, imageId }: {
      tokensToUse: number
      description: string
      imageId?: string | null
    }) => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch('/api/membership/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tokensToUse,
          description,
          imageId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to consume tokens')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch tokens
      queryClient.invalidateQueries({ queryKey: ['tokens'] })
    },
  })
}
