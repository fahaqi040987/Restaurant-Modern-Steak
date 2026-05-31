// File: frontend/src/components/notifications/UserApprovalNotification.tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserCheck, UserX, Clock } from 'lucide-react';

interface UserApprovalNotificationProps {
  notification: {
    id: string;
    metadata: {
      userId: string;
      userName: string;
      userEmail: string;
      loginTime: string;
    };
  };
  onApproved?: () => void;
  onRejected?: () => void;
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'server', label: 'Server' },
  { value: 'counter', label: 'Counter' },
  { value: 'kitchen', label: 'Kitchen' },
];

export function UserApprovalNotification({
  notification,
  onApproved,
  onRejected,
}: UserApprovalNotificationProps) {
  const [selectedRole, setSelectedRole] = useState<string>('server');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const handleApprove = () => {
    // In a real implementation, this would call an API
    console.log('Approving user:', notification.metadata.userId, 'with role:', selectedRole);
    onApproved?.();
  };

  const handleReject = () => {
    if (!showRejectConfirm) {
      setShowRejectConfirm(true);
      return;
    }
    // In a real implementation, this would call an API
    console.log('Rejecting user:', notification.metadata.userId);
    onRejected?.();
  };

  const formatLoginTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffMins < 1440) return `${Math.round(diffMins / 60)} hour${Math.round(diffMins / 60) > 1 ? 's' : ''} ago`;
    return `${Math.round(diffMins / 1440)} day${Math.round(diffMins / 1440) > 1 ? 's' : ''} ago`;
  };

  const isLoading = false; // In real implementation, track mutation state

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1">
            New User Awaiting Approval
          </h4>

          <div className="space-y-1 text-sm text-gray-600 mb-3">
            <p>
              <span className="font-medium">{notification.metadata.userName}</span>
              {' '}({notification.metadata.userEmail})
            </p>
            <p>
              Requested access {formatLoginTime(notification.metadata.loginTime)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-1" />
                  Approve
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isLoading}
              className={showRejectConfirm ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {showRejectConfirm ? (
                    <>Confirm?</>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 mr-1" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
