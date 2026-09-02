import { redirect } from 'next/navigation';
import { getUserWithRole } from '../lib/getAdminUser';
import FeedClient from './FeedClient';
import AuthForm from '../features/auth/AuthForm';

export const metadata = {
  title: 'Meova — #1 Campus Social & Student Meetup Platform | GLA University',
  description: 'Meova is the official campus social network for GLA University students. Connect with peers, book verified 1-on-1 coffee meetups, join student circles, and earn Sparks. Free to join.',
  keywords: [
    'Meova', 'meova.in', 'GLA University app', 'GLA campus social', 'GLA meet', 'GLA student network',
    'meetify alternative', 'meetifyy alternative', 'meetify GLA', 'meetifyy GLA', 'campus meetup app', 'student gigs GLA University',
    'GLA University Mathura', 'college social app India', 'student networking app GLA'
  ],
  alternates: { canonical: 'https://meova.in' },
  openGraph: {
    title: 'Meova — #1 Campus Social & Student Meetup Platform | GLA University',
    description: 'Meova is the campus social network for GLA University students. Connect with peers, book 1-on-1 meetups, and join student circles.',
    url: 'https://meova.in',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Meova Campus App' }],
  },
};

export default async function HomePage() {
  const user = await getUserWithRole();
  if (!user) {
    return <AuthForm defaultMode="login" />;
  }
  if (!user.profileComplete) {
    redirect('/onboarding');
  }

  return (
    <div className="w-full max-w-[640px] mx-auto anim-fade-in pt-2 pb-20 px-2 sm:px-4">
      {/* ── DYNAMIC INFINITE FEED CLIENT ─────────────────── */}
      <FeedClient />
    </div>
  );
}

export const dynamic = 'force-dynamic';
