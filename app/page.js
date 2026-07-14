import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import { fetchUsersAdmin, fetchCirclesAdmin, fetchUpcomingEventsAdmin } from '../lib/firebaseAdminQueries';
import Link from 'next/link';
import {
  ChevronRight, Calendar, MapPin, Users, Zap,
  Sparkles, ArrowRight, GraduationCap, Star, UserPlus, BookOpen,
  Music, Code, Dumbbell, Camera, Rocket, Palette,
  MessageCircle, CalendarDays, Search, Compass, Map
} from 'lucide-react';
import { CircleAvatar } from '../components/CircleAvatar';

export const metadata = { title: 'meetuply — Home' };

// Helpers
function avatarUrl(seed) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed || 'default')}&backgroundColor=transparent`;
}

export default async function HomePage() {
  try {
    // 1. High Security Admin Check via getUserWithRole()
    const currentUser = await getUserWithRole();

    // 2. Fetch required data safely (fallbacks internally implemented if Firestore fails)
    const [users, circles, events] = await Promise.all([
      fetchUsersAdmin(30),
      fetchCirclesAdmin(),
      fetchUpcomingEventsAdmin(10),
    ]);

    const firstName = currentUser?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0];
    const discoverPeople = currentUser ? users.filter(u => u.id !== currentUser.id).slice(0, 10) : users.slice(0, 10);

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) >= now).slice(0, 5);
    const displayEvents = upcomingEvents.length > 0 ? upcomingEvents : events.slice(0, 5);

    let totalSparks = 0;
    if (currentUser) {
      const wallet = await getOrCreateWallet(currentUser.id, currentUser.email);
      totalSparks = (wallet?.purchased || 0) + (wallet?.bonus || 0) + (wallet?.creator || 0);
    }

    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
      <div className="w-full max-w-[600px] mx-auto anim-fade-in pb-24">
        
        {/* ── HERO SECTION (Dark Glass) ────────────────────────── */}
        <div className="relative overflow-hidden mb-6 rounded-b-[2.5rem] border-b border-white/[0.04]">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-[#0a0a0a] z-0" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] z-0 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] z-0 pointer-events-none" />
          
          <div className="relative z-10 px-6 pt-10 pb-8">
            {currentUser ? (
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-bold text-neutral-400 uppercase tracking-widest">
                  {greeting}, <span className="text-white">{firstName}</span>
                </p>
                <h1 className="text-[32px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500 tracking-tight leading-tight mt-1">
                  Campus Radar
                </h1>
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 mt-6 overflow-x-auto no-scrollbar pb-1">
                  <Link href="/wallet" className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md hover:bg-white/[0.08] transition-colors whitespace-nowrap">
                    <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <span className="text-[14px] font-bold text-white">{totalSparks} <span className="text-neutral-500 font-medium">Sparks</span></span>
                  </Link>

                  <Link href="/events" className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md hover:bg-white/[0.08] transition-colors whitespace-nowrap">
                    <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[14px] font-bold text-white">{displayEvents.length} <span className="text-neutral-500 font-medium">Events</span></span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-bold text-neutral-400 uppercase tracking-widest">
                  Welcome to meetuply
                </p>
                <h1 className="text-[32px] font-extrabold text-white tracking-tight leading-tight mt-1">
                  Your campus,<br/>connected.
                </h1>
                <div className="flex gap-3 mt-8">
                  <Link href="/signup" className="bg-white text-black text-[14px] font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform">
                    Join Campus
                  </Link>
                  <Link href="/login" className="bg-white/5 text-white border border-white/10 text-[14px] font-bold px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
                    Log in
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── QUICK ACTIONS (Horizontal Scroll) ────────────────────────── */}
        {currentUser && (
          <div className="px-5 mb-8">
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {[
                { Icon: Compass,  label: 'Discover', href: '/discover', color: '#38bdf8', bg: 'bg-sky-500/10' },
                { Icon: Zap,       label: 'Wallet', href: '/wallet',   color: '#facc15', bg: 'bg-yellow-500/10' },
                { Icon: BookOpen,  label: 'Book', href: '/events',   color: '#22c55e', bg: 'bg-green-500/10' },
                { Icon: Users,     label: 'Groups', href: '/circles',  color: '#a855f7', bg: 'bg-purple-500/10' },
              ].map(({ Icon, label, href, color, bg }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center gap-2.5 flex-shrink-0 group"
                  style={{ width: '70px' }}
                >
                  <div 
                    className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center border border-white/[0.08] ${bg} group-hover:scale-105 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <p className="text-[12px] font-bold text-neutral-400 group-hover:text-white transition-colors">{label}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── CAMPUS RADAR (People Feed) ────────────────────────── */}
        <section className="mb-8">
          <div className="px-6 flex items-end justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-extrabold text-white tracking-tight">Campus Radar</h2>
              <p className="text-[13px] text-neutral-500 font-medium">Students you might know</p>
            </div>
            <Link href="/discover" className="text-[13px] font-bold text-neutral-400 hover:text-white transition-colors pb-0.5">
              View all
            </Link>
          </div>

          <div className="flex flex-col mx-3 bg-white/[0.02] border border-white/[0.04] rounded-[1.5rem] overflow-hidden">
            {discoverPeople.slice(0, 5).map((u, i) => {
              const interest = (u.interests || [])[0];
              const isLast = i === Math.min(discoverPeople.length, 5) - 1;
              
              return (
                <div key={u.id} className={`flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors ${!isLast ? 'border-b border-white/[0.04]' : ''}`}>
                  <Link href={`/users/${u.id}`} className="flex-shrink-0 relative group">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors bg-neutral-900">
                      <img src={avatarUrl(u.full_name || u.id)} alt={u.full_name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-[#0a0a0a]" />
                  </Link>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <Link href={`/users/${u.id}`} className="truncate">
                      <p className="text-[15px] font-bold text-white hover:text-indigo-400 transition-colors truncate">
                        {u.full_name || 'Student'}
                      </p>
                    </Link>
                    <p className="text-[13px] text-neutral-500 truncate font-medium mt-0.5">
                      {u.year} Year {u.branch ? `• ${u.branch.split(' ')[0]}` : ''}
                      {interest && <span className="hidden sm:inline text-neutral-400"> • {interest}</span>}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <Link href={`/messages?user=${encodeURIComponent(u.full_name || 'Student')}`}>
                      <button className="bg-white/[0.08] text-white text-[13px] font-bold w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.15] hover:scale-105 transition-all">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── ACTIVE COMMUNITIES ────────────────────────── */}
        {circles.length > 0 && (
          <section className="mb-8">
            <div className="px-6 flex items-end justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-extrabold text-white tracking-tight">Active Communities</h2>
                <p className="text-[13px] text-neutral-500 font-medium">Join the conversation</p>
              </div>
              <Link href="/circles" className="text-[13px] font-bold text-neutral-400 hover:text-white transition-colors pb-0.5">
                View all
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4">
              {circles.slice(0, 8).map(c => (
                <Link
                  key={c.id}
                  href={`/circles/${c.id}`}
                  className="flex flex-col items-center gap-3 flex-shrink-0 group"
                  style={{ width: '80px' }}
                >
                  <div className="w-[72px] h-[72px] rounded-[1.5rem] overflow-hidden border border-white/[0.08] group-hover:border-white/30 group-hover:-translate-y-1 transition-all duration-300 bg-neutral-900 shadow-xl">
                    <CircleAvatar name={c.name} size={72} radius={24} />
                  </div>
                  <p className="text-[12px] font-bold text-neutral-300 leading-tight text-center line-clamp-2 w-full group-hover:text-white transition-colors">
                    {c.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── UPCOMING EVENTS ────────────────────────── */}
        {displayEvents.length > 0 && (
          <section className="mb-8">
            <div className="px-6 flex items-end justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-extrabold text-white tracking-tight">Upcoming Events</h2>
                <p className="text-[13px] text-neutral-500 font-medium">Don't miss out</p>
              </div>
              <Link href="/events" className="text-[13px] font-bold text-neutral-400 hover:text-white transition-colors pb-0.5">
                Calendar
              </Link>
            </div>

            <div className="flex flex-col mx-3 gap-3">
              {displayEvents.map(ev => {
                const going = (ev.rsvps_list || []).length;
                const d = new Date(ev.date);
                const dayNum = d.getDate();
                const month = d.toLocaleDateString('en-IN', { month: 'short' });
                
                return (
                  <Link
                    key={ev.id}
                    href="/events"
                    className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-[1.5rem] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                  >
                    <div className="flex-shrink-0 w-[52px] h-[52px] bg-neutral-900 border border-white/[0.08] rounded-[1.2rem] flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                      <p className="text-[16px] font-extrabold text-white leading-none tracking-tighter">{dayNum}</p>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{month}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[12px] font-medium text-neutral-500 truncate max-w-[140px] bg-white/[0.05] px-2 py-0.5 rounded-md">
                          {ev.circle_name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-400">
                          <Users className="w-3.5 h-3.5" /> {going}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-1">
                      <div className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>
    );
  } catch (pageErr) {
    // CRITICAL VERCEL FIX: Do not swallow Next.js control flow exceptions!
    if (pageErr?.digest?.startsWith('NEXT_') || pageErr?.message?.includes('Dynamic server usage')) {
      throw pageErr; // Re-throw so Next.js handles redirects / dynamic rendering properly.
    }
    
    // For actual errors, we can log and show a safe fallback UI instead of crashing the site.
    console.error('[HomePage] Error:', pageErr);
    
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center mt-20">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-neutral-400 max-w-xs">
          We couldn't load your campus feed right now. Please try again in a few moments.
        </p>
        <p className="text-xs text-neutral-600 mt-4 font-mono">{pageErr?.message}</p>
      </div>
    );
  }
}
