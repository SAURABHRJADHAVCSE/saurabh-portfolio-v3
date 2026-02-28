import SignupForm from '@/components/auth/SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
  openGraph: { title: 'Sign Up', description: 'Create a new account' },
};

export default function SignupPage() {
  return <SignupForm />;
}
