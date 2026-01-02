import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  Info,
  Settings as SettingsIcon,
} from 'lucide-react';
import apiClient from '@/api/client';
import { toastHelpers } from '@/lib/toast-helpers';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch notifications
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const response = await apiClient.getNotifications(
        filter === 'unread' ? { is_read: false } : undefined
      );
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data as Notification[];
    },
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.markNotificationRead(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toastHelpers.success(t('notifications.markRead'));
    },
    onError: (error: Error) => {
      toastHelpers.error(error.message || t('errors.generic'));
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteNotification(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toastHelpers.success(t('admin.deleteNotification'));
    },
    onError: (error: Error) => {
      toastHelpers.error(error.message || t('errors.generic'));
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCheck className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      error: 'bg-red-100 text-red-800 border-red-200',
      alert: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      system: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    // Translate notification types
    const typeTranslations: Record<string, string> = {
      error: t('common.error'),
      alert: t('common.warning'),
      warning: t('common.warning'),
      success: t('common.success'),
      info: t('common.info'),
      system: t('common.system'),
    };

    return (
      <Badge
        variant="outline"
        className={cn('capitalize', typeColors[type] || typeColors.info)}
      >
        {typeTranslations[type] || type}
      </Badge>
    );
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t('notifications.justNow', 'Just now');
    if (diffInSeconds < 3600) return t('notifications.minutesAgo', '{{count}}m ago', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('notifications.hoursAgo', '{{count}}h ago', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800) return t('notifications.daysAgo', '{{count}}d ago', { count: Math.floor(diffInSeconds / 86400) });

    return date.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const unreadCount = notificationsData?.filter(n => !n.is_read).length || 0;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {t('errors.generic')}: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('admin.notificationsTitle')}</h2>
        <p className="text-muted-foreground">
          {t('admin.notificationsDesc')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                <Bell className="mr-2 h-4 w-4" />
                {t('common.all')}
                {notificationsData && (
                  <Badge variant="secondary" className="ml-2">
                    {notificationsData.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                <BellOff className="mr-2 h-4 w-4" />
                {t('admin.unread')}
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </div>

            <Button variant="ghost" size="sm" asChild>
              <a href="/admin/settings">
                <SettingsIcon className="mr-2 h-4 w-4" />
                {t('notifications.preferences')}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('notifications.title')}</CardTitle>
          <CardDescription>
            {isLoading ? (
              t('common.loading')
            ) : notificationsData && notificationsData.length > 0 ? (
              t('notifications.notificationCount', '{{count}} notification(s)', { count: notificationsData.length })
            ) : (
              t('admin.noNotifications')
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notificationsData && notificationsData.length > 0 ? (
            <div className="space-y-0">
              {notificationsData.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      'flex gap-4 py-4 px-2 rounded-md transition-colors',
                      !notification.is_read && 'bg-muted/50'
                    )}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold">{notification.title}</h4>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                        {getNotificationBadge(notification.type)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatRelativeTime(notification.created_at)}</span>
                        {notification.read_at && (
                          <>
                            <span>•</span>
                            <span>{t('admin.read')} {formatRelativeTime(notification.read_at)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markReadMutation.mutate(notification.id)}
                          disabled={markReadMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">{t('admin.markAsRead')}</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('common.delete')}</span>
                      </Button>
                    </div>
                  </div>
                  {index < notificationsData.length - 1 && <div className="border-t" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t('admin.noNotifications')}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t('notifications.allCaughtUp', "You're all caught up! Check back later for updates.")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
