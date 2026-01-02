import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon, Lock, CheckCircle2 } from 'lucide-react';
import apiClient from '@/api/client';
import { toastHelpers } from '@/lib/toast-helpers';

// Profile update schema
const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
});

// Password change schema
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Fetch user profile
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await apiClient.getUserProfile();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profileData ? {
      first_name: profileData.first_name || '',
      last_name: profileData.last_name || '',
      email: profileData.email || '',
    } : undefined,
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiClient.updateUserProfile(data);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toastHelpers.success(t('admin.profileUpdatedSuccess'));
    },
    onError: (error: Error) => {
      toastHelpers.error(error.message || t('admin.profileUpdateFailed'));
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiClient.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      toastHelpers.success(t('admin.passwordChangedSuccess'));
      resetPassword();
      setShowPasswordForm(false);
    },
    onError: (error: Error) => {
      toastHelpers.error(error.message || t('admin.passwordChangeFailed'));
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {t('admin.loadProfileFailed')}: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('admin.profileTitle')}</h2>
        <p className="text-muted-foreground">
          {t('admin.profileManageSettings')}
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {t('admin.personalInfo')}
          </CardTitle>
          <CardDescription>
            {t('admin.personalInfoDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('admin.firstName')}</Label>
                <Input
                  id="first_name"
                  {...registerProfile('first_name')}
                  placeholder="John"
                />
                {profileErrors.first_name && (
                  <p className="text-sm text-destructive">{profileErrors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">{t('admin.lastName')}</Label>
                <Input
                  id="last_name"
                  {...registerProfile('last_name')}
                  placeholder="Doe"
                />
                {profileErrors.last_name && (
                  <p className="text-sm text-destructive">{profileErrors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('admin.email')}</Label>
              <Input
                id="email"
                type="email"
                {...registerProfile('email')}
                placeholder="john.doe@example.com"
              />
              {profileErrors.email && (
                <p className="text-sm text-destructive">{profileErrors.email.message}</p>
              )}
            </div>

            {profileData && (
              <div className="space-y-2">
                <Label>{t('admin.username')}</Label>
                <Input value={profileData.username} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">{t('admin.usernameCannotChange')}</p>
              </div>
            )}

            {profileData && (
              <div className="space-y-2">
                <Label>{t('admin.role')}</Label>
                <Input
                  value={t(`roles.${profileData.role}`)}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            <div className="border-t" />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => resetProfile()}
                disabled={updateProfileMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('admin.saveChanges')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('admin.security')}
          </CardTitle>
          <CardDescription>
            {t('admin.securityDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)}>
              {t('admin.changePassword')}
            </Button>
          ) : (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">{t('admin.currentPassword')}</Label>
                <Input
                  id="current_password"
                  type="password"
                  {...registerPassword('current_password')}
                  placeholder="••••••••"
                />
                {passwordErrors.current_password && (
                  <p className="text-sm text-destructive">{passwordErrors.current_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">{t('admin.newPassword')}</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...registerPassword('new_password')}
                  placeholder="••••••••"
                />
                {passwordErrors.new_password && (
                  <p className="text-sm text-destructive">{passwordErrors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">{t('admin.confirmNewPassword')}</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  {...registerPassword('confirm_password')}
                  placeholder="••••••••"
                />
                {passwordErrors.confirm_password && (
                  <p className="text-sm text-destructive">{passwordErrors.confirm_password.message}</p>
                )}
              </div>

              <div className="border-t" />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    resetPassword();
                  }}
                  disabled={changePasswordMutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('admin.updatePassword')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      {profileData && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.accountInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('admin.accountCreated')}</span>
              <span className="font-medium">
                {new Date(profileData.created_at).toLocaleDateString(i18n.language === 'id-ID' ? 'id-ID' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('common.status')}</span>
              <span className="flex items-center gap-1 font-medium text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {t('common.active')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
