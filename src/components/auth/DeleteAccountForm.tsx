'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deleteAccountSchema, type DeleteAccountFormData } from '@/lib/validations/auth';
import { APIBook } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/auth/password-input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DeleteAccountForm() {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const form = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '', confirmText: '' },
  });

  const isGoogleUser = user?.providerData[0]?.providerId === 'google.com';

  const handleDelete = async (data?: DeleteAccountFormData) => {
    setIsDeleting(true);
    try {
      const result = await APIBook.auth.deleteAccount(isGoogleUser ? undefined : data?.password);
      if (result.success) {
        window.location.href = '/login?message=Account deleted successfully';
        return;
      }
      toast.error(result.error || 'Failed to delete account');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  /* Step 1 — Warning */
  if (!confirmed) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-destructive">Delete Account</h1>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. Your account and all data will be permanently removed.
          </p>
        </div>

        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Permanently remove all your account data</li>
          <li>Sign you out of all devices</li>
          <li>Remove access to any associated services</li>
        </ul>

        <Button variant="destructive" className="w-full" onClick={() => setConfirmed(true)}>
          I understand, continue
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/profile" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to Profile
          </Link>
        </p>
      </div>
    );
  }

  /* Step 2 — Confirmation */
  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-destructive">Confirm Deletion</h1>
        <p className="text-sm text-muted-foreground">
          {isGoogleUser
            ? 'You will be prompted to re-authenticate with Google.'
            : 'Enter your password and type DELETE to confirm.'}
        </p>
      </div>

      {isGoogleUser ? (
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => handleDelete()}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting\u2026' : 'Confirm with Google & Delete'}
        </Button>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleDelete)} className="grid gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your password"
                      disabled={isDeleting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Type <code className="rounded bg-muted px-1 text-destructive font-bold">DELETE</code> to confirm
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="DELETE" disabled={isDeleting} className="font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" variant="destructive" className="w-full" disabled={isDeleting}>
              {isDeleting ? 'Deleting\u2026' : 'Delete My Account Permanently'}
            </Button>
          </form>
        </Form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        This action is irreversible. Once deleted, your account cannot be recovered.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        <button type="button" onClick={() => setConfirmed(false)} className="font-medium text-primary underline-offset-4 hover:underline">
          Go back
        </button>
      </p>
    </div>
  );
}
