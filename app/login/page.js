import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';

export const metadata = { title: 'Log In — meetify' };

export default async function LoginPage() {
  const user = await getUserWithRole();
  if (user) {
    redirect('/');
  }

  return <AuthForm defaultMode="login" />;
}
