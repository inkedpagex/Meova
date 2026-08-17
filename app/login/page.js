import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';

export const metadata = { title: 'Log In — meetifyy.in' };

import { Suspense } from 'react';

export default async function LoginPage() {
  try {
    const user = await getUserWithRole();
    if (user) {
      redirect('/');
    }

    return (
      <Suspense fallback={<div className="p-8 text-center">Loading login...</div>}>
        <AuthForm defaultMode="login" />
      </Suspense>
    );
  } catch (error) {
    if (error?.message?.includes('NEXT_REDIRECT')) throw error;
    console.error("LoginPage Error:", error);
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-xl font-bold">Server Error on Login</h1>
        <p>{error?.message || "Unknown error occurred"}</p>
      </div>
    );
  }
}

export const dynamic = 'force-dynamic';
