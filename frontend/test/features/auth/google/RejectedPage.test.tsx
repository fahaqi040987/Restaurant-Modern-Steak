// File: frontend/test/features/auth/google/RejectedPage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RejectedPage } from '@/features/auth/google/RejectedPage';

describe('RejectedPage', () => {
  it('renders without retry date', () => {
    render(<RejectedPage />);

    expect(screen.getByText(/Account Previously Rejected/i)).toBeInTheDocument();
    expect(screen.getByText(/previously declined/i)).toBeInTheDocument();
  });

  it('renders with retry date', () => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 25);

    render(<RejectedPage retryAfter={tomorrow.toISOString()} />);

    expect(screen.getByText(/Retry Available After/i)).toBeInTheDocument();
    expect(screen.getByText(/tomorrow at/i)).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(<RejectedPage />);

    expect(screen.getByText(/contact your system administrator/i)).toBeInTheDocument();
    expect(screen.getByText(/attempt to log in again/i)).toBeInTheDocument();
  });

  it('has back to login button', () => {
    render(<RejectedPage />);

    const button = screen.getByRole('button', { name: /back to login/i });
    expect(button).toBeInTheDocument();
  });
});
