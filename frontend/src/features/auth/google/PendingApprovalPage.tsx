// File: frontend/src/features/auth/google/PendingApprovalPage.tsx
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, CheckCircle2 } from 'lucide-react';

interface PendingApprovalPageProps {
  user?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export function PendingApprovalPage({ user }: PendingApprovalPageProps) {
  const [loginTime] = useState(new Date());

  useEffect(() => {
    // Prevent going back to login
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', () => {
      window.history.pushState(null, '', window.location.href);
    });

    return () => {
      window.removeEventListener('popstate', () => {});
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Pending Approval
          </h1>
          <p className="text-gray-600">
            Your account has been created and is awaiting admin approval.
          </p>
        </div>

        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">
                  {user.first_name} {user.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Requested:</span>
                <span className="font-medium">{formatTime(loginTime)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p>
              You will receive an email notification once your account has been
              approved. You can then log in using your Google account.
            </p>
          </div>

          <div className="flex items-start gap-3 text-sm text-gray-600">
            <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p>
              This is a security measure to ensure only authorized personnel
              can access the admin portal.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Need help? Contact your system administrator.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
      </Card>
    </div>
  );
}
