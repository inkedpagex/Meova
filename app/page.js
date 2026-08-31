import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import { fetchUsersAdmin } from '../lib/supabaseQueries';
import Link from 'next/link';
import { 
  Zap, Bell, Rocket, Calendar, MapPin, ArrowUpRight 
} from 'lucide-react';
import FeedClient from './FeedClient';
import { getCartoonAvatar } from '../utils/avatar';
import HomeSparksBadge from '../components/HomeSparksBadge';

export const metadata = { title: 'Meova — Home' };

export default function HomePage() {
  return (
    <div className="w-full max-w-[640px] mx-auto anim-fade-in pt-[68px] md:pt-6 pb-24 px-4">
      {/* ── DYNAMIC INFINITE FEED CLIENT ─────────────────── */}
      <FeedClient />
    </div>
  );
}
