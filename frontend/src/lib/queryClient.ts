import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

/**
 * Enhanced Query Client Configuration with Error Handling
 * 
 * Features:
 * - Exponential backoff retry logic
 * - Global error handling for queries and mutations
 * - Automatic toast notifications for errors
 * - Offline detection and request queuing
 * - Network error retry with increasing delays
 */

/**
 * Calculate exponential backoff delay
 * Formula: min(1000 * 2^attemptIndex, 30000)
 * 
 * Attempt 0: 1000ms (1s)
 * Attempt 1: 2000ms (2s)
 * Attempt 2: 4000ms (4s)
 * Attempt 3+: 30000ms (30s max)
 */
const getRetryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
};

/**
 * Determine if an error should be retried
 * 
 * Retry on:
 * - Network errors (no response from server)
 * - 5xx server errors (500, 502, 503, 504)
 * - 408 Request Timeout
 * - 429 Too Many Requests
 * 
 * Don't retry on:
 * - 4xx client errors (except 408, 429)
 * - Authentication errors (401, 403)
 * - Validation errors (400, 422)
 */
const shouldRetry = (failureCount: number, error: any): boolean => {
  // Max 3 retries
  if (failureCount >= 3) {
    return false;
  }

  // If offline, don't retry (will be queued instead)
  if (!navigator.onLine) {
    return false;
  }

  // Network error (no response)
  if (!error.response) {
    return true;
  }

  const status = error.response?.status;

  // Retry on server errors and specific client errors
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(status);
};

/**
 * Handle query errors globally
 * Shows toast notification with appropriate message
 */
const handleQueryError = (error: any) => {
  console.error('Query error:', error);

  // Don't show toast if offline (OfflineIndicator will handle it)
  if (!navigator.onLine) {
    return;
  }

  const message = error.response?.data?.message || error.message || 'An error occurred';
  const status = error.response?.status;

  // Map status codes to user-friendly messages
  let toastMessage = message;
  if (status === 401) {
    toastMessage = 'Your session has expired. Please log in again.';
  } else if (status === 403) {
    toastMessage = "You don't have permission to access this.";
  } else if (status === 404) {
    toastMessage = 'Data not found.';
  } else if (status === 408) {
    toastMessage = 'Request timeout. Please try again.';
  } else if (status === 429) {
    toastMessage = 'Too many requests. Please wait a moment.';
  } else if (status >= 500) {
    toastMessage = 'Server error. Please try again later.';
  }

  toast({
    variant: 'destructive',
    title: 'Error',
    description: toastMessage,
  });
};

/**
 * Handle mutation errors globally
 * Shows toast notification with appropriate message
 */
const handleMutationError = (error: any) => {
  console.error('Mutation error:', error);

  // Don't show toast if offline (OfflineIndicator will handle it)
  if (!navigator.onLine) {
    return;
  }

  const message = error.response?.data?.message || error.message || 'An error occurred';
  const status = error.response?.status;

  // Map status codes to user-friendly messages
  let toastMessage = message;
  if (status === 400 || status === 422) {
    toastMessage = 'Invalid data submitted. Please check your input.';
  } else if (status === 401) {
    toastMessage = 'Your session has expired. Please log in again.';
  } else if (status === 403) {
    toastMessage = "You don't have permission to perform this action.";
  } else if (status === 404) {
    toastMessage = 'Resource not found.';
  } else if (status === 409) {
    toastMessage = 'Data conflict. Please reload the page.';
  } else if (status === 429) {
    toastMessage = 'Too many requests. Please wait a moment.';
  } else if (status >= 500) {
    toastMessage = 'Server error. Please try again later.';
  }

  toast({
    variant: 'destructive',
    title: 'Operation Failed',
    description: toastMessage,
  });
};

/**
 * Create Query Cache with global error handling
 */
const queryCache = new QueryCache({
  onError: handleQueryError,
});

/**
 * Create Mutation Cache with global error handling
 */
const mutationCache = new MutationCache({
  onError: handleMutationError,
});

/**
 * Enhanced Query Client with retry logic and error handling
 */
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Retry configuration with exponential backoff
      retry: shouldRetry,
      retryDelay: getRetryDelay,

      // Stale time: 5 minutes
      staleTime: 1000 * 60 * 5,

      // Cache time: 10 minutes
      gcTime: 1000 * 60 * 10,

      // Refetch on window focus
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations with exponential backoff
      retry: shouldRetry,
      retryDelay: getRetryDelay,
    },
  },
});

/**
 * Handle online/offline events for query client
 * Automatically refetch queries when connection is restored
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🟢 Connection restored - refetching queries');
    queryClient.refetchQueries({
      type: 'active',
    });
    
    toast({
      title: 'Back Online',
      description: 'Connection restored. Syncing data...',
    });
  });

  window.addEventListener('offline', () => {
    console.log('🔴 Connection lost');
    
    toast({
      variant: 'destructive',
      title: 'No Connection',
      description: 'You are offline. Changes will be saved when connection is restored.',
    });
  });
}

/**
 * Utility function to manually retry a failed query
 * 
 * Usage:
 * const handleRetry = () => retryQuery(['queryKey']);
 */
export const retryQuery = (queryKey: any[]) => {
  queryClient.refetchQueries({ queryKey });
};

/**
 * Utility function to manually retry all failed queries
 * 
 * Usage:
 * <Button onClick={retryAllFailedQueries}>Retry All</Button>
 */
export const retryAllFailedQueries = () => {
  const queries = queryClient.getQueryCache().getAll();
  const failedQueries = queries.filter(query => query.state.status === 'error');
  
  console.log(`Retrying ${failedQueries.length} failed queries...`);
  
  failedQueries.forEach(query => {
    query.fetch();
  });
  
  if (failedQueries.length > 0) {
    toast({
      title: 'Retrying',
      description: `Retrying ${failedQueries.length} failed requests...`,
    });
  }
};
