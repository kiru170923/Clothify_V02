import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '../components/SupabaseProvider'
import { supabase } from '../lib/supabase'
import { UserMembership } from '../types/membership'

export interface MembershipResponse {
  membership: UserMembership | null
  isNewUser?: boolean
}

// Fetch user membership
export function useMembership() {
  const { user } = useSupabase()

  return useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async (): Promise<MembershipResponse> => {
      if (!user) {
        throw new Error('No user')
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session token')
      }

      const response = await fetch('/api/membership/current', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch membership')
      }

      return response.json()
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}
