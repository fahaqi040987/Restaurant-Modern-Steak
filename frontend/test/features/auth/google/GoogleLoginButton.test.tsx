// File: frontend/test/features/auth/google/GoogleLoginButton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleLoginButton } from '@/features/auth/google/GoogleLoginButton';

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('renders with Google branding', () => {
    render(<GoogleLoginButton />);

    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
  });

  it('shows loading state when clicked', () => {
    render(<GoogleLoginButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText(/Connecting.../i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('calls onError when Google OAuth fails', async () => {
    const onError = vi.fn();

    // Mock missing client ID
    const originalClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    (import.meta as any).env.VITE_GOOGLE_CLIENT_ID = undefined;

    render(<GoogleLoginButton onError={onError} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    // Restore
    (import.meta as any).env.VITE_GOOGLE_CLIENT_ID = originalClientId;
  });

  it('redirects to Google OAuth on click', () => {
    // Mock client ID
    (import.meta as any).env.VITE_GOOGLE_CLIENT_ID = 'test-client-id';

    render(<GoogleLoginButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(window.location.href).toContain('accounts.google.com');
    expect(window.location.href).toContain('client_id=');
    expect(window.location.href).toContain('redirect_uri=');
  });

  it('stores state in sessionStorage', () => {
    const sessionStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        clear: () => { store = {}; },
      };
    })();

    Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

    render(<GoogleLoginButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(sessionStorageMock.getItem('google_oauth_state')).toBeTruthy();
    expect(sessionStorageMock.getItem('google_oauth_state')?.length).toBeGreaterThan(10);
  });
});
