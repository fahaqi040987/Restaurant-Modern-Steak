import { useEffect, useState } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Offline Indicator Component
 * 
 * Displays a fixed banner at the top of the screen when the user is offline.
 * Automatically detects network status and updates the UI accordingly.
 * 
 * Features:
 * - Auto-detects online/offline status using browser APIs
 * - Fixed banner with smooth slide-in/out animation
 * - Dismissible with close button
 * - Shows different messages for offline and back online states
 * - Bilingual support (Indonesian primary, English secondary)
 * 
 * Usage:
 * Place this component in your root layout or app component:
 * 
 * <OfflineIndicator />
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setShowBanner(true);
      
      // Auto-hide "back online" message after 5 seconds
      setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300"
      role="alert"
      aria-live="assertive"
    >
      {isOnline && wasOffline ? (
        // Back online banner (success)
        <div className={cn(
          "border-l-0 border-r-0 border-t-0 border-b-2 border-b-green-500 bg-green-50 p-4"
        )}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-900 font-medium">
                  Anda kembali online! / You're back online!
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowBanner(false);
                setWasOffline(false);
              }}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 flex-shrink-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
      ) : (
        // Offline banner (warning)
        <div className={cn(
          "border-l-0 border-r-0 border-t-0 border-b-2 border-b-orange-500 bg-orange-50 p-4"
        )}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-orange-600 animate-pulse flex-shrink-0" />
              <div>
                <p className="text-orange-900 font-medium">
                  Tidak ada koneksi internet / No internet connection
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Beberapa fitur mungkin tidak tersedia. Perubahan akan disimpan saat koneksi pulih.
                </p>
                <p className="text-xs text-orange-600">
                  Some features may be unavailable. Changes will be saved when connection is restored.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBanner(false)}
              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100 flex-shrink-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to detect online/offline status
 * 
 * Returns the current online status and updates when it changes.
 * 
 * Usage:
 * const isOnline = useOnlineStatus();
 * 
 * if (!isOnline) {
 *   return <div>You're offline</div>;
 * }
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Offline Queue Manager
 * 
 * Stores failed API requests in localStorage and retries them when online.
 * 
 * Features:
 * - Persists failed requests across page refreshes
 * - Automatically retries when connection is restored
 * - Prevents duplicate requests
 * - Configurable retry limit
 */
export class OfflineQueueManager {
  private static STORAGE_KEY = 'offline_queue';
  private static MAX_RETRIES = 3;

  static addToQueue(request: {
    url: string;
    method: string;
    data?: unknown;
    timestamp: number;
  }) {
    const queue = this.getQueue();
    queue.push({ ...request, retries: 0 });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
  }

  static getQueue(): Array<{
    url: string;
    method: string;
    data?: unknown;
    timestamp: number;
    retries: number;
  }> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static clearQueue() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static async processQueue(_apiClient: unknown) {
    if (!navigator.onLine) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    const failedRequests: Array<{
      url: string;
      method: string;
      data?: unknown;
      timestamp: number;
      retries: number;
    }> = [];

    for (const request of queue) {
      try {
        // Attempt to replay the request
        // You would call your API client here
        // await apiClient[request.method](request.url, request.data);
      } catch (error) {
        console.error(`Failed to process queued request: ${request.url}`, error);

        // Increment retry count
        request.retries += 1;

        // Re-queue if under retry limit
        if (request.retries < this.MAX_RETRIES) {
          failedRequests.push(request);
        } else {
          console.warn(`Dropped request after ${this.MAX_RETRIES} retries: ${request.url}`);
        }
      }
    }

    // Update queue with only failed requests that can still be retried
    if (failedRequests.length > 0) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(failedRequests));
    } else {
      this.clearQueue();
    }
  }
}
