import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import { fetchUsersAdmin } from '../lib/firebaseAdminQueries';
import Link from 'next/link';
import { 
  Zap, Bell, Rocket, Calendar, MapPin, ArrowUpRight 
} from 'lucide-react';
import FeedClient from './FeedClient';
import { getCartoonAvatar } from '../utils/avatar';
import HomeSparksBadge from '../components/HomeSparksBadge';

export const metadata = { title: 'meetifyy — Home' };

export default async function HomePage() {
  try {
    const currentUser = await getUserWithRole();
    const users = await fetchUsersAdmin(50);
    const people = currentUser ? users.filter(u => u.id !== currentUser.id) : users;

    let totalSparks = 0;
    if (currentUser) {
      const wallet = await getOrCreateWallet(currentUser.id, currentUser.email);
      totalSparks = (wallet?.purchased || 0) + (wallet?.bonus || 0) + (wallet?.creator || 0);
    }

    const firstName = currentUser?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Student';

    return (
      <div className="w-full max-w-[640px] mx-auto anim-fade-in pb-24 px-4">
        {/* ── DYNAMIC INFINITE FEED CLIENT ─────────────────── */}
        <FeedClient currentUser={currentUser} initialSparks={totalSparks} people={people} />
      </div>
    );
  } catch (pageErr) {
    if (pageErr?.digest?.startsWith('NEXT_') || pageErr?.message?.includes('Dynamic server usage')) {
      throw pageErr;
    }
    
    console.error('[HomePage] Error:', pageErr);
    
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center mt-20">
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-xs text-neutral-600 mt-4 font-mono">{pageErr?.message}</p>
      </div>
    );
  }
}
