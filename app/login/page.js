import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';
import { Suspense } from 'react';

export const metadata = { title: 'Log In — meetuply.in' };

export default async function LoginPage() {
  let serverError = null;

  try {
    const user = await getUserWithRole();
    if (user) {
      redirect('/');
    }
  } catch (error) {
    if (error?.message?.includes('NEXT_REDIRECT')) throw error;
    console.error("LoginPage Error:", error);
    serverError = error?.message || "Unknown error occurred";
  }

  if (serverError) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-xl font-bold">Server Error on Login</h1>
        <p>{serverError}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading login...</div>}>
      <AuthForm defaultMode="login" />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
