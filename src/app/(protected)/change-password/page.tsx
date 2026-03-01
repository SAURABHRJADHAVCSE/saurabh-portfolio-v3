import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Password',
  description: 'Update your account password',
  openGraph: { title: 'Change Password', description: 'Update your account password' },
};

export default function ChangePasswordPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <ChangePasswordForm />
    </section>
  );
}
