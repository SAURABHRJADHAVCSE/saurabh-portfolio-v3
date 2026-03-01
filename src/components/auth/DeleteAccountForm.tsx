'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deleteAccountSchema, type DeleteAccountFormData } from '@/lib/validations/auth';
import { APIBook } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
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

  const handleDelete = useCallback(async (data?: DeleteAccountFormData) => {
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
  }, [isGoogleUser]);

  /* ── Step 1: Warning ────────────────────────────────────────────── */
  if (!confirmed) {
    return (
      <div className="grid gap-6 w-full">
        <header className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-destructive sm:text-2xl">
            Delete Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This action cannot be undone. Your account and all data will be permanently removed.
          </p>
        </header>

        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Permanently remove all your account data</li>
          <li>Sign you out of all devices</li>
          <li>Remove access to any associated services</li>
        </ul>

        <button
          onClick={() => setConfirmed(true)}
          className="w-full rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          I understand, continue
        </button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/profile" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to Profile
          </Link>
        </p>
      </div>
    );
  }

  /* ── Step 2: Confirmation ───────────────────────────────────────── */
  return (
    <div className="grid gap-6 w-full">
      <header className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-destructive sm:text-2xl">
          Confirm Deletion
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isGoogleUser
            ? 'You will be prompted to re-authenticate with Google.'
            : 'Enter your password and type DELETE to confirm.'}
        </p>
      </header>

      {isGoogleUser ? (
        <button
          onClick={() => handleDelete()}
          disabled={isDeleting}
          className="w-full rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isDeleting ? 'Deleting\u2026' : 'Confirm with Google & Delete'}
        </button>
      ) : (
        <form onSubmit={form.handleSubmit(handleDelete)} className="grid gap-4">
          {/* Password */}
          <fieldset disabled={isDeleting} className="grid gap-1.5">
            <label htmlFor="delete-pw" className="text-sm font-medium">
              Current Password
            </label>
            <PasswordInput
              id="delete-pw"
              value={form.watch('password')}
              onChange={v => form.setValue('password', v, { shouldValidate: true })}
              placeholder="Enter your password"
              disabled={isDeleting}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </fieldset>

          {/* Confirm text */}
          <fieldset disabled={isDeleting} className="grid gap-1.5">
            <label htmlFor="delete-confirm" className="text-sm font-medium">
              Type <code className="rounded bg-muted px-1 text-destructive font-bold">DELETE</code> to confirm
            </label>
            <input
              id="delete-confirm"
              placeholder="DELETE"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-sm outline-none transition-colors focus:ring-2 focus:ring-ring disabled:opacity-50"
              {...form.register('confirmText')}
            />
            {form.formState.errors.confirmText && (
              <p className="text-xs text-destructive">{form.formState.errors.confirmText.message}</p>
            )}
          </fieldset>

          <button
            type="submit"
            disabled={isDeleting}
            className="w-full rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isDeleting ? 'Deleting\u2026' : 'Delete My Account Permanently'}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        This action is irreversible. Once deleted, your account cannot be recovered.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Go back
        </button>
      </p>
    </div>
  );
}
