import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Join Meova — GLA University Campus Social & Meetup App',
  description: 'Sign up free on Meova — the campus social platform for GLA University students. Book meetups, earn Sparks on gigs, join student circles.',
  keywords: [
    'GLA University app', 'Meova login', 'GLA meet app', 'campus social platform GLA',
    'meetify GLA alternative', 'meetifyy GLA alternative', 'GLA University social network', 'student meetup app GLA',
    'college app Mathura', 'GLA University networking app'
  ],
  alternates: { canonical: 'https://meova.in/login' },
  openGraph: {
    title: 'Join Meova — GLA University Campus Social App',
    description: 'Book meetups, earn Sparks, and join student circles at GLA University. Free to join.',
    url: 'https://meova.in/login',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

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
