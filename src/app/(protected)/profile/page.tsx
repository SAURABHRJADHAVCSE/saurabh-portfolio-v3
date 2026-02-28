import UserProfile from '@/components/auth/UserProfile';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your account settings and preferences',
  openGraph: { title: 'Profile', description: 'Manage your account settings and preferences' },
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>
      <UserProfile />
    </div>
  );
}
