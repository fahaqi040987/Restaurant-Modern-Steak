// File: frontend/test/components/notifications/UserApprovalNotification.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserApprovalNotification } from '@/components/notifications/UserApprovalNotification';

const mockNotification = {
  id: 'notif-1',
  metadata: {
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    loginTime: new Date().toISOString(),
  },
};

describe('UserApprovalNotification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('displays user information', () => {
    render(<UserApprovalNotification notification={mockNotification} />, { wrapper });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Requested access/i)).toBeInTheDocument();
  });

  it('shows role dropdown with all options', () => {
    render(<UserApprovalNotification notification={mockNotification} />, { wrapper });

    const dropdown = screen.getByRole('combobox');
    fireEvent.click(dropdown);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Server')).toBeInTheDocument();
    expect(screen.getByText('Counter')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
  });

  it('calls onApproved when approve is clicked', async () => {
    const onApproved = vi.fn();

    render(
      <UserApprovalNotification
        notification={mockNotification}
        onApproved={onApproved}
      />,
      { wrapper }
    );

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(onApproved).toHaveBeenCalled();
    });
  });

  it('shows confirmation on first reject click', () => {
    render(<UserApprovalNotification notification={mockNotification} />, { wrapper });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    expect(screen.getByText(/confirm\?/i)).toBeInTheDocument();
  });

  it('calls onRejected when reject is confirmed', async () => {
    const onRejected = vi.fn();

    render(
      <UserApprovalNotification
        notification={mockNotification}
        onRejected={onRejected}
      />,
      { wrapper }
    );

    const rejectButton = screen.getByRole('button', { name: /reject/i });

    // First click - show confirmation
    fireEvent.click(rejectButton);
    expect(screen.getByText(/confirm\?/i)).toBeInTheDocument();

    // Second click - confirm
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(onRejected).toHaveBeenCalled();
    });
  });
});
