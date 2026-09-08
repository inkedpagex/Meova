import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/getAdminUser';
import AuthForm from '../../features/auth/AuthForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Join Meova — Campus Social & Student Meetup Platform',
  description: 'Sign up free on Meova — the verified campus social platform for college students. Book meetups, earn Sparks, and join student circles.',
  keywords: [
    'Meova', 'Meova login', 'Meova signup', 'campus social platform',
    'student networking', 'college meetup app', 'campus social network'
  ],
  alternates: { canonical: 'https://meova.in/login' },
  openGraph: {
    title: 'Join Meova — Campus Social & Meetup Platform',
    description: 'Book meetups, earn Sparks, and join student circles on campus. Free to join.',
    url: 'https://meova.in/login',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

export default async function LoginPage() {
  let serverError = null;
  let isAdminHost = false;

  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const host = headersList.get('host') || '';
    isAdminHost = host.startsWith('admin.');

    const user = await getUserWithRole();
    if (user) {
      if (isAdminHost && user.role === 'admin') {
        redirect('/admin');
      }
      if (host.startsWith('app.')) {
        redirect('/');
      }
      const isProd = process.env.NODE_ENV === 'production';
      const appUrl = isProd ? 'https://app.meova.in' : '/';
      redirect(appUrl);
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

  if (isAdminHost) {
    const isProd = process.env.NODE_ENV === 'production';
    const mainUrl = isProd ? 'https://meova.in' : 'http://localhost:3000';
    redirect(mainUrl);
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading login...</div>}>
      <AuthForm defaultMode="login" />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
