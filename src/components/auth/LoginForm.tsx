'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APIBook } from '@/lib/firebase/services';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/auth/password-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginForm() {
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isRedirectingRef = useRef(false);
  const toastShownRef = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  // Flash ?message= once on mount
  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success(decodeURIComponent(msg));
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && !isRedirectingRef.current) {
      router.replace(searchParams.get('redirect') || '/profile');
    }
  }, [loading, isAuthenticated, router, searchParams]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const redirectTo = searchParams.get('redirect') || '/profile';

  const onSubmit = async (data: LoginFormData) => {
    setEmailLoading(true);
    const result = await APIBook.auth.loginWithEmail(data.email, data.password);
    if (result.success) {
      isRedirectingRef.current = true;
      router.replace(redirectTo);
    } else {
      toast.error(result.error || 'Login failed');
    }
    setEmailLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await APIBook.auth.loginWithGoogle();
    if (result.success) {
      isRedirectingRef.current = true;
      router.replace(redirectTo);
    } else {
      toast.error(result.error || 'Google login failed');
    }
    setGoogleLoading(false);
  };

  const busy = emailLoading || googleLoading;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Email / Password form */}
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter your password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={busy}>
            {emailLoading ? 'Signing in\u2026' : 'Sign In'}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="relative text-center text-xs text-muted-foreground after:absolute after:inset-0 after:top-1/2 after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2">Or continue with</span>
      </div>

      {/* Google */}
      <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09a6.97 6.97 0 0 1 0-4.18V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {googleLoading && 'Signing in\u2026'}
      </Button>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
