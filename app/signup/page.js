import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';

export const metadata = { title: 'Sign Up — meetify' };

export default async function SignupPage() {
  const user = await getUserWithRole();
  if (user) {
    redirect('/');
  }

  return <AuthForm defaultMode="signup" />;
}
