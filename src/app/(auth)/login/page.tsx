import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your account',
  openGraph: { title: 'Login', description: 'Sign in to your account' },
};

/**
 * Suspense boundary is required because LoginForm calls useSearchParams()
 * (to read the ?redirect= param). Without it, Next.js cannot statically
 * pre-render this page.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
