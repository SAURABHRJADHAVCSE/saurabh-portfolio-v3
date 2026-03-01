import UserProfile from '@/components/auth/UserProfile';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your account settings and preferences',
  openGraph: { title: 'Profile', description: 'Manage your account settings and preferences' },
};

export default function ProfilePage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Manage your account settings and security preferences
        </p>
      </header>
      <UserProfile />
    </section>
  );
}
