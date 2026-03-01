'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook } from '@/lib/firebase/services';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations/auth';
import PasswordInput from '@/components/auth/password-input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ChangePasswordForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = useCallback(async (data: ChangePasswordFormData) => {
    setLoading(true);
    const result = await APIBook.auth.changePassword(data.currentPassword, data.newPassword);
    if (result.success) {
      setSuccess(true);
      toast.success('Password changed successfully');
      form.reset();
    } else {
      toast.error(result.error || 'Failed to change password');
    }
    setLoading(false);
  }, [form]);

  if (success) {
    return (
      <div className="grid gap-6 text-center w-full">
        <header>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Password Changed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been updated securely.
          </p>
        </header>
        <Link
          href="/profile"
          className="flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          Back to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 w-full">
      <header className="text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Change Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your current password and choose a new one
        </p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {/* Current Password */}
        <fieldset disabled={loading} className="grid gap-1.5">
          <label htmlFor="cp-current" className="text-sm font-medium">Current Password</label>
          <PasswordInput
            id="cp-current"
            value={form.watch('currentPassword')}
            onChange={v => form.setValue('currentPassword', v, { shouldValidate: true })}
            placeholder="Enter current password"
            disabled={loading}
          />
          {form.formState.errors.currentPassword && (
            <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>
          )}
        </fieldset>

        {/* New Password */}
        <fieldset disabled={loading} className="grid gap-1.5">
          <label htmlFor="cp-new" className="text-sm font-medium">New Password</label>
          <PasswordInput
            id="cp-new"
            value={form.watch('newPassword')}
            onChange={v => form.setValue('newPassword', v, { shouldValidate: true })}
            placeholder="Enter new password"
            showStrength
            email={user?.email ?? ''}
            disabled={loading}
          />
          {form.formState.errors.newPassword && (
            <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
          )}
        </fieldset>

        {/* Confirm New Password */}
        <fieldset disabled={loading} className="grid gap-1.5">
          <label htmlFor="cp-confirm" className="text-sm font-medium">Confirm New Password</label>
          <PasswordInput
            id="cp-confirm"
            value={form.watch('confirmNewPassword')}
            onChange={v => form.setValue('confirmNewPassword', v, { shouldValidate: true })}
            placeholder="Confirm new password"
            disabled={loading}
          />
          {form.formState.errors.confirmNewPassword && (
            <p className="text-xs text-destructive">{form.formState.errors.confirmNewPassword.message}</p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? 'Changing\u2026' : 'Change Password'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/profile" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to Profile
        </Link>
      </p>
    </div>
  );
}
