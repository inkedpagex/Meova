import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import { fetchUsersAdmin } from '../lib/firebaseAdminQueries';
import Link from 'next/link';
import { 
  Zap, Bell, Rocket, Calendar, MapPin, ArrowUpRight 
} from 'lucide-react';
import FeedClient from './FeedClient';
import { getCartoonAvatar } from '../utils/avatar';

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
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#12111d] to-[#1e1c31] border border-[#6366f1]/25 p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          {/* Top accent glow bar */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899]" />
          
          {/* Floating graphic overlay & glow */}
          <div className="absolute top-[-40px] right-[-40px] w-60 h-60 bg-[#6366f1]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-[#ec4899]/10 rounded-full blur-[65px] pointer-events-none" />
          
          <div className="absolute top-6 right-6 text-white/5 select-none pointer-events-none">
            <Rocket size={90} className="transform rotate-12 opacity-30" />
          </div>

          <div className="relative z-10 space-y-4 max-w-[90%]">
            <span className="inline-block bg-gradient-to-r from-[#ec4899] to-[#818cf8] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm">
              Featured Event
            </span>
            
            <div className="space-y-1.5">
              <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-300 tracking-tight leading-tight">
                Startup Networking Meetup
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] font-semibold leading-relaxed">
                Connect with student founders, pitch your ideas, and team up for campus hackathons.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 py-2 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[9.5px] text-[var(--text-secondary)] font-black uppercase tracking-wider w-fit">
              <div className="flex items-center gap-1.5">
                <Calendar size={11} className="text-[#a855f7]" />
                <span>24 May · 4:00 PM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="text-[#ec4899]" />
                <span>Auditorium, Block 1</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {/* Overlapping Attending Avatars */}
              <div className="flex -space-x-2.5 overflow-hidden">
                {['Aarav', 'Neha', 'Kabir', 'Riya'].map((name) => (
                  <img
                    key={name}
                    className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-neutral-900 object-cover"
                    src={getCartoonAvatar(name)}
                    alt="Attendee"
                  />
                ))}
                <div className="flex items-center justify-center h-6.5 w-6.5 rounded-full ring-2 ring-neutral-900 bg-[#4f46e5] text-[9px] font-black text-white">
                  +18
                </div>
              </div>

              <Link href="/events" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#6366f1] to-[#ec4899] hover:opacity-90 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 cursor-pointer">
                <span>Join Now</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

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
