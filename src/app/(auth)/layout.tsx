import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Sign in or create an account',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect to profile if already logged in
  const user = await getCurrentUser();

  if (user) {
    redirect('/profile');
  }

  return <>{children}</>;
}

