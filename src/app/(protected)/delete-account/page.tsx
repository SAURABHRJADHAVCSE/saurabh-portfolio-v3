import DeleteAccountForm from '@/components/auth/DeleteAccountForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account',
  description: 'Permanently delete your account and all associated data',
  openGraph: { title: 'Delete Account', description: 'Permanently delete your account and all associated data' },
};

export default function DeleteAccountPage() {
  return (
    <div className="container mx-auto flex max-w-sm flex-col items-center px-4 py-12">
      <DeleteAccountForm />
    </div>
  );
}
