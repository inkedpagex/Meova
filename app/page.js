import { redirect } from 'next/navigation';
import { getUserWithRole } from '../lib/getAdminUser';
import FeedClient from './FeedClient';
import MarketingHome from '../components/MarketingHome';
import { supabaseAdmin } from '../lib/supabase/admin';

export const metadata = {
  title: 'Meova — Verified Campus Social Network & Student Meetups',
  description: 'Meova is the verified campus social network for Indian university students. Connect with verified peers, book 1-on-1 coffee meets, and join student circles.',
  keywords: [
    'Meova', 'meova.in', 'www.meova.in', 'GLA University app', 'GLA campus social', 'GLA meet', 'GLA student network',
    'meetify alternative', 'campus meetup app', 'college social app India', 'student networking app India'
  ],
  alternates: { canonical: 'https://meova.in' },
  openGraph: {
    title: 'Meova — Verified Campus Social Network & Student Meetups',
    description: 'Connect with verified university peers, book 1-on-1 coffee meets, and join student circles.',
    url: 'https://meova.in',
    siteName: 'Meova',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Meova — Verified Campus Social Network & Student Meetups',
      },
      {
        url: '/logo.png',
        width: 1200,
        height: 800,
        alt: 'Meova Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meova — Verified Campus Social Network & Student Meetups',
    description: 'Connect with verified university peers, book 1-on-1 coffee meets, and join student circles.',
    images: ['/og-image.png'],
  },
};

export default async function HomePage() {
  const user = await getUserWithRole();
  if (!user) {
    let colleges = [];
    try {
      const { data } = await supabaseAdmin
        .from('colleges')
        .select('id, name, city, state, is_active')
        .eq('is_active', true)
        .order('name');
      colleges = data || [];
    } catch (e) {
      console.error('Error fetching colleges for marketing homepage:', e);
    }
    return <MarketingHome colleges={colleges} />;
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
