import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Password',
  description: 'Update your account password',
  openGraph: { title: 'Change Password', description: 'Update your account password' },
};

export default function ChangePasswordPage() {
  return (
    <div className="container mx-auto flex max-w-sm flex-col items-center px-4 py-12">
      <ChangePasswordForm />
    </div>
  );
}
