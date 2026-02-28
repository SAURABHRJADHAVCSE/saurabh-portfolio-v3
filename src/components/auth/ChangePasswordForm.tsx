'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook } from '@/lib/firebase/services';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/auth/password-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

  const onSubmit = async (data: ChangePasswordFormData) => {
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
  };

  if (success) {
    return (
      <div className="grid gap-6 text-center">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Password Changed</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been updated securely.
          </p>
        </div>
        <Link href="/profile">
          <Button className="w-full">Back to Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Change Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your current password and choose a new one
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter current password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter new password"
                    showStrength
                    email={user?.email ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmNewPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Confirm new password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Changing\u2026' : 'Change Password'}
          </Button>
        </form>
      </Form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/profile" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to Profile
        </Link>
      </p>
    </div>
  );
}
