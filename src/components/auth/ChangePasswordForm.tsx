'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook } from '@/lib/firebase/services';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);
    setSuccess(false);

    const result = await APIBook.auth.changePassword(data.currentPassword, data.newPassword);
    
    if (result.success) {
      setSuccess(true);
      toast.success('Password changed successfully');
      form.reset();
      
      // Call success callback after showing success message
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } else {
      toast.error(result.error || 'Failed to change password');
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-2" />
          <CardTitle className="title">Password Changed Successfully</CardTitle>
          <CardDescription className="muted">
            Your password has been updated securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onCancel && (
            <Button onClick={onCancel} className="w-full">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
        <CardTitle className="title">Change Password</CardTitle>
        <CardDescription className="muted">
          Enter your current password and choose a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="Enter your current password"
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
                      placeholder="Enter your new password"
                      showStrength={true}
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
                      placeholder="Confirm your new password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className={onCancel ? "flex-1" : "w-full"}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
