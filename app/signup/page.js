import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';

export const metadata = { title: 'Sign Up — meetifyy' };

import { Suspense } from 'react';

export default async function SignupPage() {
  const user = await getUserWithRole();
  if (user) {
    redirect('/');
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading signup...</div>}>
      <AuthForm defaultMode="signup" />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
