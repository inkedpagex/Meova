import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';

export const metadata = { title: 'Log In — meetifyy.in' };

import { Suspense } from 'react';

export default async function LoginPage() {
  const user = await getUserWithRole();
  if (user) {
    redirect('/');
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading login...</div>}>
      <AuthForm defaultMode="login" />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
