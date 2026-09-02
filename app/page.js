import { redirect } from 'next/navigation';
import { getUserWithRole } from '../lib/getAdminUser';
import FeedClient from './FeedClient';

export const metadata = {
  title: 'Meova — GLA University Campus Social, Meetups & Gigs Platform',
  description: 'Meova is the #1 campus social app for GLA University students. Book 1-on-1 meetups, earn Sparks on gigs, share moments & join circles. Free to join.',
  keywords: [
    'Meova', 'GLA University app', 'GLA campus social', 'GLA meet', 'GLA student network',
    'meetify alternative', 'meetifyy alternative', 'meetify GLA', 'meetifyy GLA', 'campus meetup app', 'student gigs GLA University',
    'GLA University Mathura', 'college social app India', 'student networking app GLA'
  ],
  alternates: { canonical: 'https://meova.in' },
  openGraph: {
    title: 'Meova — GLA University Campus Social & Meetup Platform',
    description: 'Connect with GLA University peers, book 1-on-1 meetups, earn Sparks on campus gigs, and join student circles.',
    url: 'https://meova.in',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Meova Campus App' }],
  },
};

export default async function HomePage() {
  const user = await getUserWithRole();
  if (!user) {
    redirect('/login');
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
