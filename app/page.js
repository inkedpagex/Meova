import { redirect } from 'next/navigation';
import { getUserWithRole } from '../lib/getAdminUser';
import FeedClient from './FeedClient';

export const metadata = { title: 'Meova — Home' };

export default async function HomePage() {
  const user = await getUserWithRole();
  if (!user) {
    redirect('/login');
  }
  if (!user.profileComplete) {
    redirect('/onboarding');
  }

  return (
    <div className="w-full max-w-[640px] mx-auto anim-fade-in pt-[68px] md:pt-6 pb-24 px-4">
      {/* ── DYNAMIC INFINITE FEED CLIENT ─────────────────── */}
      <FeedClient />
    </div>
  );
}

export const dynamic = 'force-dynamic';
