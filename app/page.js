import { redirect } from 'next/navigation';
import { getUserWithRole } from '../lib/getAdminUser';
import FeedClient from './FeedClient';
import MarketingHome from '../components/MarketingHome';
import { supabaseAdmin } from '../lib/supabase/admin';

export const metadata = {
  title: 'Meova — Campus Social Network & 1-on-1 Student Meetups',
  description: 'Connect with verified college peers, book 1-on-1 study & coffee meetups, earn Sparks, and join student circles on campus. Free to join.',
  keywords: [
    'Meova', 'meova.in', 'www.meova.in', 'campus social network', 'college meetup app',
    'student networking app', 'college social app', 'student circles', 'study sessions', 'coffee meets'
  ],
  alternates: { canonical: 'https://meova.in' },
  openGraph: {
    title: 'Meova — Campus Social Network & 1-on-1 Student Meetups',
    description: 'Connect with verified university peers, book 1-on-1 study & coffee meets, and join student circles on campus.',
    url: 'https://meova.in',
    siteName: 'Meova',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Meova — Campus Social & Meetup Platform',
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
    title: 'Meova — Campus Social Network & 1-on-1 Student Meetups',
    description: 'Connect with verified university peers, book 1-on-1 study & coffee meets, and join student circles on campus.',
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
