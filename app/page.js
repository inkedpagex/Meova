import { getUserAdmin } from '../lib/getUserAdmin';
import { fetchUsersAdmin, fetchCirclesAdmin, fetchUpcomingEventsAdmin } from '../lib/firebaseAdminQueries';
import Link from 'next/link';
import {
  ChevronRight, Calendar, MapPin, Users, Zap,
  Coffee, Gamepad2, Sparkles, ArrowRight,
  GraduationCap, Star, UserPlus, BookOpen,
  Music, Code, Dumbbell, Camera, Rocket, Palette,
  MessageCircle, CalendarDays
} from 'lucide-react';
import { CircleAvatar } from '../components/CircleAvatar';

export const metadata = { title: 'meetuply — Home' };

function avatarUrl(seed) {
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed || 'default')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

const INTEREST_META = {
  'Coding & Tech':        { Icon: Code,        color: '#3b82f6' },
  'Music & Bands':        { Icon: Music,        color: '#a855f7' },
  'Sports & Fitness':     { Icon: Dumbbell,     color: '#22c55e' },
  'Photography & Film':   { Icon: Camera,       color: '#06b6d4' },
  'Entrepreneurship':     { Icon: Rocket,       color: '#f97316' },
  'Art & Sketching':      { Icon: Palette,      color: '#ec4899' },
  'Gaming & E-sports':    { Icon: Gamepad2,     color: '#a78bfa' },
};

const CATEGORY_COLOR = {
  'Coding & Tech': '#3b82f6',
  'Music & Bands': '#a855f7',
  'Sports & Fitness': '#22c55e',
  'Dance': '#ec4899',
  'Gaming & E-sports': '#f97316',
  'Photography & Film': '#06b6d4',
  'Entrepreneurship': '#f97316',
  'Art & Sketching': '#ec4899',
  'Theatre & Drama': '#a855f7',
};

const TAG_MAP = {
  'Coding & Tech': 'tag-blue',
  'Music & Bands': 'tag-purple',
  'Sports & Fitness': 'tag-green',
  'Dance': 'tag-pink',
  'Gaming & E-sports': 'tag-orange',
  'Photography & Film': 'tag-cyan',
  'Entrepreneurship': 'tag-orange',
  'Art & Sketching': 'tag-pink',
  'Theatre & Drama': 'tag-purple',
};

export default async function HomePage() {
  const [currentUser, users, circles, events] = await Promise.all([
    getUserAdmin(),
    fetchUsersAdmin(30),
    fetchCirclesAdmin(),
    fetchUpcomingEventsAdmin(10),
  ]);

  const firstName = currentUser?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0];
  const discoverPeople = currentUser ? users.filter(u => u.id !== currentUser.id).slice(0, 12) : users.slice(0, 12);

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now).slice(0, 5);
  const displayEvents = upcomingEvents.length > 0 ? upcomingEvents : events.slice(0, 5);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-[860px] anim-fade-in relative pb-8">

      {/* Ambient glows */}
      <div className="fixed top-[-80px] right-[-60px] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-20 left-[200px] w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* ── HERO GREETING ──────────────────────── */}
      <div className="mb-10">
        {currentUser ? (
          <>
            <p className="text-[11px] font-bold text-neutral-500 tracking-[0.18em] uppercase mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3 h-3" />
              {greeting}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
              {firstName},
              <br />
              <span className="text-neutral-400">who's on campus?</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-4 font-medium flex items-center gap-3">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{discoverPeople.length} students</span>
              <span className="w-1 h-1 bg-neutral-700 rounded-full" />
              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{displayEvents.length} events</span>
              <span className="w-1 h-1 bg-neutral-700 rounded-full" />
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-yellow-400" />Spend Sparks to connect</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold text-neutral-500 tracking-[0.18em] uppercase mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-3 h-3" /> meetuply
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
              Meet your campus,
              <br />
              <span className="text-neutral-400">one profile at a time.</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-4 max-w-sm leading-relaxed">
              Discover students, book study sessions, attend events, and build real connections using Sparks — your campus currency.
            </p>
            <div className="flex gap-3 mt-6">
              <Link href="/signup" className="btn btn-primary text-xs px-6 py-3 shadow-xl hover:scale-105 transition-transform active:scale-95">
                Join Campus →
              </Link>
              <Link href="/login" className="btn btn-ghost text-xs px-5 py-3">Log in</Link>
            </div>
          </>
        )}
      </div>

      {/* ── PEOPLE FEED — PRIMARY SECTION ──────── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-black text-neutral-500 tracking-[0.14em] uppercase mb-1">Campus Network</p>
            <h2 className="text-lg font-black text-white tracking-tight">People on Your Campus</h2>
          </div>
          <Link href="/discover" className="flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-wider">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Featured large profile + grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {discoverPeople.slice(0, 6).map((u, idx) => {
            const interest = (u.interests || [])[0];
            const meta = INTEREST_META[interest] || { Icon: Star, color: '#6b7280' };
            const { Icon: InterestIcon } = meta;
            const isLarge = idx === 0;
            return (
              <div
                key={u.id}
                className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${isLarge ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Top accent bar in interest color */}
                <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${meta.color}, transparent)` }} />

                {/* Subtle hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${meta.color}12 0%, transparent 65%)` }}
                />

                <div className="p-4">
                  {/* Avatar row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl overflow-hidden" style={{ border: `1px solid ${meta.color}30` }}>
                          <img src={avatarUrl(u.full_name || u.id)} alt={u.full_name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        {/* Online dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#080808]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate leading-tight">{u.full_name || 'Student'}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{u.year} Year · {u.branch?.split(' ')[0]}</p>
                      </div>
                    </div>
                    {/* Interest icon */}
                    <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}20` }}>
                      <InterestIcon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    </div>
                  </div>

                  {/* Bio or interest tags */}
                  {u.bio ? (
                    <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2 mb-3">{u.bio}</p>
                  ) : interest ? (
                    <p className="text-[11px] text-neutral-500 leading-relaxed mb-3">
                      Interested in <span style={{ color: meta.color }} className="font-semibold">{interest}</span>
                    </p>
                  ) : null}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black py-2 rounded-lg transition-all active:scale-95 uppercase tracking-wide" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}>
                      <Zap className="w-3 h-3" />
                      Book · 50 ⚡
                    </button>
                    <button className="p-2 rounded-lg transition-all active:scale-95 hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {discoverPeople.length > 6 && (
          <Link href="/discover" className="mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold text-neutral-500 hover:text-white transition-all hover:bg-white/[0.02]" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
            View all {discoverPeople.length} students <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </section>

      {/* ── HOW IT WORKS — Quick Actions ──────── */}
      <section className="mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { Icon: UserPlus,  label: 'Discover', sub: 'Browse profiles',    href: '/discover', color: '#3b82f6' },
            { Icon: Zap,       label: 'Spend',    sub: 'Use your Sparks',    href: '/wallet',   color: '#facc15' },
            { Icon: BookOpen,  label: 'Book',     sub: 'Reserve a session',  href: '/events',   color: '#22c55e' },
            { Icon: Users,     label: 'Circles',  sub: 'Join communities',   href: '/circles',  color: '#a855f7' },
          ].map(({ Icon, label, sub, href, color }) => (
            <Link
              key={label}
              href={href}
              className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(ellipse at 0% 0%, ${color}18 0%, transparent 70%)` }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xs font-black text-white">{label}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">{sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── UPCOMING EVENTS ───────────────────── */}
      {displayEvents.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-black text-neutral-500 tracking-[0.14em] uppercase mb-1">Calendar</p>
              <h2 className="text-lg font-black text-white tracking-tight">Upcoming Events</h2>
            </div>
            <Link href="/events" className="flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-wider">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {displayEvents.map(ev => {
              const going = (ev.rsvps_list || []).length;
              const d = new Date(ev.date);
              const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
              const dayNum = d.getDate();
              const month = d.toLocaleDateString('en-IN', { month: 'short' });
              return (
                <Link
                  key={ev.id}
                  href="/events"
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:bg-white/[0.02]"
                  style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {/* Date block */}
                  <div className="flex-shrink-0 w-11 text-center">
                    <p className="text-[9px] font-bold text-neutral-500 uppercase">{dayName}</p>
                    <p className="text-lg font-black text-white leading-none">{dayNum}</p>
                    <p className="text-[9px] font-bold text-neutral-500 uppercase">{month}</p>
                  </div>

                  <div className="w-px h-8 bg-white/[0.05] flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5 truncate">{ev.circle_name}</p>
                    <p className="text-sm font-bold text-white truncate">{ev.title}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-neutral-600 hidden md:flex items-center gap-1">
                      <Users className="w-3 h-3" /> {going}
                    </span>
                    {ev.location && (
                      <span className="text-[10px] text-neutral-600 hidden md:flex items-center gap-1 max-w-[90px] truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> {ev.location.split(',')[0]}
                      </span>
                    )}
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
                      RSVP
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── COMMUNITIES ──────────────────────── */}
      {circles.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-black text-neutral-500 tracking-[0.14em] uppercase mb-1">Communities</p>
              <h2 className="text-lg font-black text-white tracking-tight">Active Circles</h2>
            </div>
            <Link href="/circles" className="flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-wider">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scroll pb-2 -mx-1 px-1">
            {circles.slice(0, 8).map(c => {
              const accentColor = CATEGORY_COLOR[c.category] || '#6b7280';
              return (
                <Link
                  key={c.id}
                  href={`/circles/${c.id}`}
                  className="group flex-shrink-0 relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 active:scale-95"
                  style={{ width: 160, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor}12 0%, transparent 65%)` }} />

                  <div className="w-10 h-10 rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${accentColor}30` }}>
                    <CircleAvatar name={c.name} size={40} radius="10px" />
                  </div>
                  <p className="text-xs font-bold text-white leading-tight line-clamp-2 mb-1">{c.name}</p>
                  <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" /> {c.member_count || 0} members
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── GUEST CTA ────────────────────────── */}
      {!currentUser && (
        <div
          className="relative overflow-hidden rounded-3xl p-8 text-center mt-4"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 pointer-events-none" />
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl">
            <GraduationCap className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mb-2">Join your campus community</h3>
          <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto leading-relaxed">
            Sign up, earn Sparks, and start connecting with students at your college.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup" className="btn btn-primary text-xs px-6 py-3 shadow-xl">Get Early Access</Link>
            <Link href="/login" className="btn btn-ghost text-xs px-6 py-3">Log in</Link>
          </div>
        </div>
      )}
    </div>
  );
}
