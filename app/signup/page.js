import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';

export const metadata = { title: 'Sign Up — meetifyy' };

import { Suspense } from 'react';

export default async function SignupPage() {
  try {
    const user = await getUserWithRole();
    if (user) {
      redirect('/');
    }

    return (
      <Suspense fallback={<div className="p-8 text-center">Loading signup...</div>}>
        <AuthForm defaultMode="signup" />
      </Suspense>
    );
  } catch (error) {
    if (error?.message?.includes('NEXT_REDIRECT')) throw error;
    console.error("SignupPage Error:", error);
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-xl font-bold">Server Error on Signup</h1>
        <p>{error?.message || "Unknown error occurred"}</p>
      </div>
    );
  }
}

export const dynamic = 'force-dynamic';
