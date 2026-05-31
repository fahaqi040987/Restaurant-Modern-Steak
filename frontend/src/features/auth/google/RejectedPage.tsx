// File: frontend/src/features/auth/google/RejectedPage.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Calendar, Mail } from 'lucide-react';

interface RejectedPageProps {
  retryAfter?: string; // ISO timestamp
}

export function RejectedPage({ retryAfter }: RejectedPageProps) {
  const formatRetryDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHrs = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHrs < 24) {
      return `today at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}`;
    }

    return `on ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Previously Rejected
          </h1>
          <p className="text-gray-600">
            Your account request was previously declined by an administrator.
          </p>
        </div>

        {retryAfter && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Retry Available After:</span>
            </div>
            <p className="text-red-700 font-semibold text-lg">
              {formatRetryDate(retryAfter)}
            </p>
          </div>
        )}

        <div className="space-y-4 text-sm text-gray-600 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p>
              If you believe this is an error, please contact your system
              administrator for assistance.
            </p>
          </div>
          <p>
            After the retry period, you can attempt to log in again via
            Google SSO.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => window.location.href = '/login'}
          className="w-full"
        >
          Back to Login
        </Button>
      </Card>
    </div>
  );
}
