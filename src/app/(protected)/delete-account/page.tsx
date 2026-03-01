import DeleteAccountForm from '@/components/auth/DeleteAccountForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account',
  description: 'Permanently delete your account and all associated data',
  openGraph: { title: 'Delete Account', description: 'Permanently delete your account and all associated data' },
};

export default function DeleteAccountPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <DeleteAccountForm />
    </section>
  );
}
