import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

/**
 * Shared query for public restaurant info (contact details, operating hours,
 * social links). Using one hook keeps query options consistent across every
 * consumer (layout, header, pages) so one cached entry is shared and a slow or
 * failing request retries a bounded number of times instead of leaving pages
 * stuck in a loading state.
 */
export function useRestaurantInfo() {
  return useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5, // 5 minutes for faster updates after admin changes
    retry: 2, // bounded retries (react-query default is 3 with longer backoff)
    refetchOnMount: true,
  })
}

export default useRestaurantInfo
