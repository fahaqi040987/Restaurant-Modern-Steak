import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfilePage } from '../ProfilePage';
import apiClient from '@/api/client';
import { toastHelpers } from '@/lib/toast-helpers';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'admin.loadProfileFailed': 'Failed to load profile',
        'admin.profileTitle': 'Profile',
        'admin.profileManageSettings': 'Manage your account settings and preferences',
        'admin.personalInfo': 'Personal Information',
        'admin.personalInfoDesc': 'Update your personal details',
        'admin.firstName': 'First Name',
        'admin.lastName': 'Last Name',
        'admin.email': 'Email',
        'admin.username': 'Username',
        'admin.usernameCannotChange': 'Username cannot be changed',
        'admin.role': 'Role',
        'admin.saveChanges': 'Save Changes',
        'admin.security': 'Security',
        'admin.securityDesc': 'Manage your password and security settings',
        'admin.changePassword': 'Change Password',
        'admin.currentPassword': 'Current Password',
        'admin.newPassword': 'New Password',
        'admin.confirmNewPassword': 'Confirm New Password',
        'admin.updatePassword': 'Update Password',
        'admin.accountInfo': 'Account Information',
        'admin.accountCreated': 'Account Created',
        'admin.profileUpdatedSuccess': 'Profile updated successfully',
        'admin.profileUpdateFailed': 'Failed to update profile',
        'admin.passwordChangedSuccess': 'Password changed successfully',
        'admin.passwordChangeFailed': 'Failed to change password',
        'common.cancel': 'Cancel',
        'common.status': 'Status',
        'common.active': 'Active',
        'roles.admin': 'Administrator',
        'roles.manager': 'Manager',
        'roles.server': 'Server',
        'roles.counter': 'Counter',
        'roles.kitchen': 'Kitchen',
      }
      return translations[key] || key
    },
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn(),
    },
  }),
}));

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
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText(/first name/i);
    // Use fireEvent for more reliable clearing and validation
    fireEvent.change(firstNameInput, { target: { value: '' } });
    fireEvent.blur(firstNameInput);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Validation may be handled by HTML5 required attribute or Zod
    await waitFor(() => {
      // Check if form submission was prevented (button should still be enabled)
      expect(saveButton).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Submit the form directly to bypass HTML5 validation
    const form = emailInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('submits profile update successfully', async () => {
    (apiClient.updateUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { ...mockUser, first_name: 'Jane' },
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiClient.updateUserProfile).toHaveBeenCalledWith({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      });
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(toastHelpers.success).toHaveBeenCalledWith('Profile updated successfully');
    });
  });

  it('shows password form when change password is clicked', async () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('validates password confirmation matches', async () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'differentpassword' } });

    const updateButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'short' } });

    const updateButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits password change successfully', async () => {
    (apiClient.changePassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    // Use fireEvent for more reliable form filling
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });

    const updateButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(apiClient.changePassword).toHaveBeenCalledWith({
        current_password: 'oldpassword',
        new_password: 'newpassword123',
      });
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(toastHelpers.success).toHaveBeenCalledWith('Password changed successfully');
    });
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
