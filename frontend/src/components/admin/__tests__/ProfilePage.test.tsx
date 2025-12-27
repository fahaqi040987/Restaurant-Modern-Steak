import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfilePage } from '../ProfilePage';

// Mock the API client
vi.mock('@/api/client', () => ({
  default: {
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Mock toast helpers
vi.mock('@/lib/toast-helpers', () => ({
  toastHelpers: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import apiClient from '@/api/client';
import { toastHelpers } from '@/lib/toast-helpers';

const mockUser = {
  id: '1',
  username: 'testuser',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: mockUser,
    });
  });

  it('renders profile form with user data', async () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    // The component shows a Loader2 spinner which uses animate-spin class
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('shows error state when profile fetch fails', async () => {
    (apiClient.getUserProfile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Failed to fetch profile')
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
    });
  });

  it('validates first name is required', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');

    // Submit the form directly to bypass HTML5 validation
    const form = emailInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('submits profile update successfully', async () => {
    const user = userEvent.setup();
    (apiClient.updateUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { ...mockUser, first_name: 'Jane' },
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(apiClient.updateUserProfile).toHaveBeenCalledWith({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      });
    });

    expect(toastHelpers.success).toHaveBeenCalledWith('Profile updated successfully');
  });

  it('shows password form when change password is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('validates password confirmation matches', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    await user.type(screen.getByLabelText(/current password/i), 'oldpassword');
    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'differentpassword');

    const updateButton = screen.getByRole('button', { name: /update password/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    await user.type(screen.getByLabelText(/current password/i), 'old');
    await user.type(screen.getByLabelText(/^new password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i), 'short');

    const updateButton = screen.getByRole('button', { name: /update password/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits password change successfully', async () => {
    const user = userEvent.setup();
    (apiClient.changePassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    await user.type(screen.getByLabelText(/current password/i), 'oldpassword');
    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword123');

    const updateButton = screen.getByRole('button', { name: /update password/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(apiClient.changePassword).toHaveBeenCalledWith({
        current_password: 'oldpassword',
        new_password: 'newpassword123',
      });
    });

    expect(toastHelpers.success).toHaveBeenCalledWith('Password changed successfully');
  });

  it('displays account information', async () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    expect(screen.getByText(/account information/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });
});
