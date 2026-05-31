// File: frontend/src/features/auth/google/GoogleLinkButton.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Link as LinkIcon, Unlink } from 'lucide-react';

interface GoogleLinkButtonProps {
  linked: boolean;
  googleEmail?: string;
  onLink?: (googleId: string) => void;
  onUnlink?: () => void;
}

export function GoogleLinkButton({
  linked,
  googleEmail,
  onLink,
  onUnlink,
}: GoogleLinkButtonProps) {
  const [linking, setLinking] = useState(false);

  const handleLink = () => {
    setLinking(true);

    // Generate state
    const state = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('google_link_state', state);

    // Build Google OAuth URL for linking
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not configured');
      setLinking(false);
      return;
    }

    const redirectUri = `${window.location.origin}/settings/profile`; // Redirect back to profile

    const scope = encodeURIComponent('openid profile email');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `state=${state}&` +
      `prompt=consent`;

    // Store link intent in sessionStorage
    sessionStorage.setItem('google_link_intent', 'true');

    window.location.href = authUrl;
  };

  const handleUnlink = () => {
    if (confirm('Are you sure you want to unlink your Google account? You will need to use your password to log in.')) {
      onUnlink?.();
    }
  };

  if (linked) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-900">Google Account Linked</p>
            <p className="text-sm text-green-700">{googleEmail}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnlink}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          <Unlink className="w-4 h-4 mr-2" />
          Unlink
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleLink}
      disabled={linking}
      className="w-full"
    >
      {linking ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Link Google Account
        </>
      )}
    </Button>
  );
}
