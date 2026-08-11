'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Users, User, LogIn, Wallet, Shield, Plus, Bell, Zap, MessageSquare } from 'lucide-react';
import { getUserAvatarUrl } from '../utils/avatar';
import { mockDb } from '../lib/mockDatabase';

const AUTH_PATHS = ['/login', '/signup'];

// Inline SVG logo — no image file needed
function MeetifyLogo({ size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 18V9l9 6 9-6v9"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 9l9-6 9 6"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [dbUser, setDbUser] = React.useState(user);
  const [sparks, setSparks] = React.useState(0);

  React.useEffect(() => {
    const sync = () => {
      if (user && typeof window !== 'undefined') {
        const u = mockDb.getUser(user.id);
        if (u) setDbUser(u);
        else {
          mockDb.updateUser(user.id, { id: user.id, uid: user.id, full_name: user.full_name || 'User', email: user.email || '', branch: user.branch || 'General', year: user.year || '1st', bio: user.bio || '', interests: user.interests || [], instagram: user.instagram || '', isIdOn: true });
          const fresh = mockDb.getUser(user.id);
          if (fresh) setDbUser(fresh);
        }
        const w = mockDb.getWallet(user.id);
        if (w) setSparks((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
      }
    };
    sync();
    if (typeof window !== 'undefined') {
      window.addEventListener('profile-updated', sync);
      window.addEventListener('wallet-updated', sync);
      return () => { window.removeEventListener('profile-updated', sync); window.removeEventListener('wallet-updated', sync); };
    }
  }, [user]);

  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const NAV = [
    { href: '/',              label: 'Home',          Icon: Home },
    { href: '/discover',      label: 'Discover',      Icon: Search },
    { href: '/messages',      label: 'Messages',      Icon: MessageSquare },
    { href: '/notifications', label: 'Notifications', Icon: Bell },
    { href: '/circles',       label: 'Communities',   Icon: Users },
    ...(user ? [{ href: '/wallet', label: 'Wallet', Icon: Wallet }] : []),
    { href: '/profile',       label: 'Profile',       Icon: User },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: Shield }] : []),
  ];

  const MOBILE_NAV = [
    { href: '/',        label: 'Home',        Icon: Home },
    { href: '/discover',label: 'Discover',    Icon: Search },
    { href: '/create',  label: 'Plus',        Icon: Plus, isCenter: true },
    { href: '/circles', label: 'Communities', Icon: Users },
    { href: '/profile', label: 'Profile',     Icon: User },
  ];

  const avatarSrc = getUserAvatarUrl(dbUser);

  // Hide all navigation chrome on auth pages
  if (AUTH_PATHS.includes(pathname)) return null;

  return (
    <>
      {/* ── Mobile top header ────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-[60px] flex items-center justify-between px-4"
        style={{ background: '#ffffff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <MeetifyLogo size={28} />
          <span className="font-black text-[17px] tracking-tight text-zinc-900">meetifyy</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Sparks badge */}
              <Link href="/wallet" className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black"
                style={{ background: '#f3f0ff', color: '#7c3aed' }}>
                <Zap size={11} className="fill-current" />
                <span>{sparks.toLocaleString()}</span>
              </Link>

              {/* Messages icon */}
              <Link href="/messages" className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: '#f8f8fa', border: '1px solid #e8e8ea' }}>
                <MessageSquare size={16} className="text-zinc-600" strokeWidth={2} />
              </Link>

              {/* Notification bell */}
              <Link href="/notifications" className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: '#f8f8fa', border: '1px solid #e8e8ea' }}>
                <Bell size={16} className="text-zinc-600" strokeWidth={2} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7c3aed] rounded-full border-2 border-white" />
              </Link>

              {/* Avatar */}
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '2px solid #e8e8ea' }}>
                  <img src={avatarSrc} alt="me" className="w-full h-full object-cover" />
                </div>
              </Link>
            </>
          ) : (
            <Link href="/login"
              className="px-4 py-2 rounded-full text-[11px] font-black text-white"
              style={{ background: '#7c3aed' }}>
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* ── Desktop sidebar ──────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40"
        style={{ width: 220, background: '#ffffff', borderRight: '1px solid #f0f0f0', padding: '28px 16px' }}>

        <div className="flex items-center gap-2.5 px-2 mb-10">
          <MeetifyLogo size={32} />
          <span className="font-black text-[18px] tracking-tight text-zinc-900">meetifyy</span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            if (href === '/profile' && !user) return null;
            const active = isActive(href);
            return (
              <Link key={href} href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: active ? '#f3f0ff' : 'transparent', color: active ? '#7c3aed' : '#71717a' }}>
                <div className="flex items-center gap-3">
                  <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
                  <span style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
                </div>
                {label === 'Notifications' && (
                  <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                )}
                {label === 'Wallet' && sparks > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f3f0ff', color: '#7c3aed' }}>
                    {sparks.toLocaleString()}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
          {user ? (
            <Link href="/profile" className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all hover:bg-zinc-50">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1.5px solid #e8e8ea' }}>
                <img src={avatarSrc} alt="me" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate text-zinc-900">{dbUser?.full_name || (user.email || 'user').split('@')[0]}</p>
                <p className="text-[10px] truncate text-zinc-400">View Profile</p>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-black text-white"
              style={{ background: '#7c3aed' }}>
              <LogIn size={14} /> Log in
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ───────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-end justify-around"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #f0f0f0',
          height: 'calc(64px + env(safe-area-inset-bottom))',
          paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.04)',
        }}>
        {MOBILE_NAV.map(({ href, label, Icon, isCenter }) => {
          if ((href === '/profile') && !user) {
            return (
              <Link key={href} href="/login" className="flex-1 flex flex-col items-center justify-center h-12 text-zinc-400">
                <LogIn size={19} strokeWidth={1.75} />
                <span className="text-[9px] font-bold mt-0.5">Login</span>
              </Link>
            );
          }
          const active = isActive(href);

          if (isCenter) {
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center relative -top-4 h-16 select-none"
                style={{ zIndex: 60 }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                  style={{ background: '#7c3aed', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                  <Plus size={24} strokeWidth={2.5} className="text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center h-12 relative select-none transition-all"
              style={{ color: active ? '#7c3aed' : '#a1a1aa' }}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[9.5px] font-bold mt-0.5" style={{ color: active ? '#7c3aed' : '#a1a1aa' }}>{label}</span>
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#7c3aed]" />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
