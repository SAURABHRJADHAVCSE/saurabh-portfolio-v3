import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your account password',
  openGraph: { title: 'Forgot Password', description: 'Reset your account password' },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ForgotPasswordForm 
        showBackToLogin={true}
      />
    </div>
  );
}
