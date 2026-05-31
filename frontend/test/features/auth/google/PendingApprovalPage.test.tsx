// File: frontend/test/features/auth/google/PendingApprovalPage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PendingApprovalPage } from '@/features/auth/google/PendingApprovalPage';

describe('PendingApprovalPage', () => {
  it('renders without user info', () => {
    render(<PendingApprovalPage />);

    expect(screen.getByText(/Account Pending Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/Your account has been created/i)).toBeInTheDocument();
  });

  it('renders with user info', () => {
    const user = {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    render(<PendingApprovalPage user={user} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays helpful information', () => {
    render(<PendingApprovalPage />);

    expect(screen.getByText(/will receive an email notification/i)).toBeInTheDocument();
    expect(screen.getByText(/security measure/i)).toBeInTheDocument();
  });

  it('has back to login button', () => {
    render(<PendingApprovalPage />);

    const button = screen.getByRole('button', { name: /back to login/i });
    expect(button).toBeInTheDocument();
  });
});
