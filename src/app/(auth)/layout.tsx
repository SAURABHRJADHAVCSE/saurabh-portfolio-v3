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
  const user = await getCurrentUser();
  if (user) redirect('/profile');

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — brand / hero panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <span className="text-lg font-semibold tracking-tight">Acme Inc.</span>
        <blockquote className="space-y-2">
          <p className="text-lg leading-relaxed">
            &ldquo;This template has saved me countless hours of work and helped
            me ship products faster than ever before.&rdquo;
          </p>
          <footer className="text-sm opacity-80">— Happy Developer</footer>
        </blockquote>
        <p className="text-xs opacity-60">&copy; {new Date().getFullYear()} Acme Inc.</p>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

