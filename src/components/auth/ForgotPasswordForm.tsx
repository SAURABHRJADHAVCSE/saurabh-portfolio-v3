'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook } from '@/lib/firebase/services';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    const result = await APIBook.auth.resetPassword(data.email);
    if (result.success) setEmailSent(true);
    else toast.error(result.error || 'Failed to send reset email');
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div className="grid gap-6 text-center">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Reset Email Sent</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to your email address.
            Check your inbox and follow the instructions.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </p>
        <Link href="/login">
          <Button className="w-full">Back to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending\u2026' : 'Send Reset Email'}
          </Button>
        </form>
      </Form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
