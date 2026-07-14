import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import Link from 'next/link';
import { 
  Zap, Bell, Rocket, Calendar, MapPin, ArrowUpRight 
} from 'lucide-react';
import FeedClient from './FeedClient';

export const metadata = { title: 'meetuply — Home' };

export default async function HomePage() {
  try {
    const currentUser = await getUserWithRole();

    let totalSparks = 0;
    if (currentUser) {
      const wallet = await getOrCreateWallet(currentUser.id, currentUser.email);
      totalSparks = (wallet?.purchased || 0) + (wallet?.bonus || 0) + (wallet?.creator || 0);
    }

    const firstName = currentUser?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Student';

    return (
      <div className="w-full max-w-[640px] mx-auto anim-fade-in pb-24 px-4 space-y-8">
        
        {/* ── HEADER SECTION ────────────────────────── */}
        <div className="flex items-center justify-between pt-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Hi, {firstName} 👋
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-widest">
              Let's vibe on campus today
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/wallet" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:border-[#6366f1]/30 transition-all">
              <Zap size={14} className="text-[#fb923c] fill-current" />
              <span className="text-xs font-black text-[var(--text-primary)]">{totalSparks}</span>
            </Link>
            <Link href="/notifications" className="w-9 h-9 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#6366f1] transition-all">
              <Bell size={15} />
            </Link>
          </div>
        </div>

        {/* ── FEATURED EVENT BANNER ────────────────────────── */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6366f1] via-[#818cf8] to-[#4f46e5] text-white p-6 md:p-8 shadow-[0_20px_50px_rgba(99,102,241,0.3)]">
          {/* Floating graphic overlay */}
          <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-4 right-6 text-white/20 select-none pointer-events-none">
            <Rocket size={100} className="transform rotate-12 opacity-40" />
          </div>

          <div className="relative z-10 space-y-4 max-w-[85%]">
            <span className="inline-block bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white">
              Featured Event
            </span>
            
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                Startup Networking Meetup
              </h2>
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                Connect with student founders, pitch your ideas, and team up for campus hackathons.
              </p>
            </div>

            <div className="flex flex-col gap-1 text-[11px] text-white/90 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>24 May • 4:00 PM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} />
                <span>Auditorium, Block 1</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {/* Overlapping Attending Avatars */}
              <div className="flex -space-x-2.5 overflow-hidden">
                {['Aarav', 'Neha', 'Kabir', 'Riya'].map((name, i) => (
                  <img
                    key={name}
                    className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-[#6366f1] bg-neutral-900"
                    src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${name}`}
                    alt="Attendee"
                  />
                ))}
                <div className="flex items-center justify-center h-6.5 w-6.5 rounded-full ring-2 ring-[#6366f1] bg-[#4f46e5] text-[9px] font-black">
                  +18
                </div>
              </div>

              <Link href="/events" className="inline-flex items-center gap-1.5 bg-white text-[#4f46e5] text-[11px] font-black px-4.5 py-2.5 rounded-full hover:scale-105 transition-all shadow-md">
                <span>Join Now</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── DYNAMIC INFINITE FEED CLIENT ─────────────────── */}
        <FeedClient currentUser={currentUser} initialSparks={totalSparks} />

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
