import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

interface BadgeCounts {
  notifications: number;
  newContacts: number;
}

/**
 * Hook to fetch badge counts (unread notifications, new contacts)
 * with automatic polling every 30 seconds
 */
export function useBadgeCounts() {
  const { data: notifData } = useQuery({
    queryKey: ['badge-counts', 'notifications'],
    queryFn: async () => {
      const response = await apiClient.getUnreadCounts();
      return response.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
  });

  const { data: contactsData } = useQuery({
    queryKey: ['badge-counts', 'contacts'],
    queryFn: async () => {
      const response = await apiClient.getNewContactsCount();
      return response.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 25000,
  });

  const counts: BadgeCounts = {
    notifications: notifData?.notifications || 0,
    newContacts: contactsData?.new_contacts || 0,
  };

  return counts;
}
