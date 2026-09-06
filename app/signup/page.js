import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';
import { Suspense } from 'react';

export const metadata = { title: 'Sign Up — Meova' };

export default async function SignupPage() {
  let serverError = null;

  try {
    const user = await getUserWithRole();
    if (user) {
      const isProd = process.env.NODE_ENV === 'production';
      const appUrl = isProd ? 'https://app.meova.in' : 'http://app.localhost:3000';
      redirect(appUrl);
    }
  } catch (error) {
    if (error?.message?.includes('NEXT_REDIRECT')) throw error;
    console.error("SignupPage Error:", error);
    serverError = error?.message || "Unknown error occurred";
  }

  if (serverError) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-xl font-bold">Server Error on Signup</h1>
        <p>{serverError}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading signup...</div>}>
      <AuthForm defaultMode="signup" />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';

