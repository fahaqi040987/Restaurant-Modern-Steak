// File: frontend/test/features/auth/google/GoogleLinkButton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoogleLinkButton } from '@/features/auth/google/GoogleLinkButton';

describe('GoogleLinkButton', () => {
  beforeEach(() => {
    delete (window as any).location;
    (window as any).location = { href: '' };
    (window as any).sessionStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
    };
  });

  it('shows link button when not linked', () => {
    render(<GoogleLinkButton linked={false} />);

    expect(screen.getByText(/Link Google Account/i)).toBeInTheDocument();
  });

  it('shows linked state when linked', () => {
    render(
      <GoogleLinkButton
        linked={true}
        googleEmail="test@example.com"
      />
    );

    expect(screen.getByText(/Google Account Linked/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unlink/i })).toBeInTheDocument();
  });

  it('redirects to Google OAuth on link click', () => {
    (import.meta as any).env.VITE_GOOGLE_CLIENT_ID = 'test-client-id';

    render(<GoogleLinkButton linked={false} />);

    const button = screen.getByRole('button', { name: /link google account/i });
    fireEvent.click(button);

    expect(window.location.href).toContain('accounts.google.com');
    expect((window as any).sessionStorage.setItem).toHaveBeenCalledWith(
      'google_link_intent',
      'true'
    );
  });

  it('shows confirmation dialog on unlink', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onUnlink = vi.fn();

    render(
      <GoogleLinkButton
        linked={true}
        googleEmail="test@example.com"
        onUnlink={onUnlink}
      />
    );

    const unlinkButton = screen.getByRole('button', { name: /unlink/i });
    fireEvent.click(unlinkButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('unlink your Google account')
    );
  });
});
