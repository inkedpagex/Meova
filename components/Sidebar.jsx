'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, User, LogIn, Calendar, Wallet, Shield, Plus, MessageSquare, Briefcase, Bell, Crown } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getUserAvatarUrl } from '../utils/avatar';
import { mockDb } from '../lib/mockDatabase';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [dbUser, setDbUser] = React.useState(user);
  const [sparks, setSparks] = React.useState(0);

  React.useEffect(() => {
    const syncUserAndWallet = () => {
      if (user && typeof window !== 'undefined') {
        const u = mockDb.getUser(user.id);
        if (u) {
          setDbUser(u);
        } else {
          // If the user isn't in mockDb, initialize their local record!
          mockDb.updateUser(user.id, {
            id: user.id,
            uid: user.id,
            full_name: user.full_name || 'User',
            email: user.email || '',
            branch: user.branch || 'General',
            year: user.year || '1st',
            bio: user.bio || '',
            interests: user.interests || [],
            instagram: user.instagram || '',
            isIdOn: true
          });
          const fresh = mockDb.getUser(user.id);
          if (fresh) setDbUser(fresh);
        }

        // Fetch wallet live from mockDb
        const wallet = mockDb.getWallet(user.id);
        if (wallet) {
          setSparks((wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0));
        }
      }
    };

    syncUserAndWallet();

    if (typeof window !== 'undefined') {
      window.addEventListener('profile-updated', syncUserAndWallet);
      window.addEventListener('wallet-updated', syncUserAndWallet);
      return () => {
        window.removeEventListener('profile-updated', syncUserAndWallet);
        window.removeEventListener('wallet-updated', syncUserAndWallet);
      };
    }
  }, [user]);

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const NAV = [
    { href: '/',             label: 'Home',          Icon: Home },
    { href: '/experiences',  label: 'Experiences',   Icon: Compass },
    { href: '/messages',     label: 'Messages',      Icon: MessageSquare },
    { href: '/notifications',label: 'Notifications', Icon: Bell },
    ...(user ? [{ href: '/wallet',  label: 'Wallet',   Icon: Wallet, badge: `${sparks.toLocaleString()} ⚡` }] : []),
    { href: '/profile',      label: 'Profile',       Icon: User },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: Shield }] : []),
  ];

  const MOBILE_NAV = [
    { href: '/',             label: 'Home',          Icon: Home },
    { href: '/experiences',  label: 'Experiences',   Icon: Compass },
    { href: '/messages',     label: 'Messages',      Icon: MessageSquare },
    { href: '/wallet',       label: 'Wallet',        Icon: Wallet },
    { href: '/profile',      label: 'Profile',       Icon: User },
  ];

  return (
    <>
      {/* ── Mobile: frosted top header ────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-[56px] flex items-center justify-between px-5"
        style={{ background:'var(--bg-surface)', borderBottom:'2px solid var(--border-mid)', boxShadow: '0 2px 20px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
            <img src="/logo.png" alt="meetifyy logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-[17px] tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>meetifyy</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/wallet" className="glass flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                <span>{sparks.toLocaleString()}</span>
                <span className="text-[#fb923c]">⚡</span>
              </Link>
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '1px solid var(--border-mid)', background: 'var(--bg-overlay)' }}>
                <img src={getUserAvatarUrl(dbUser)} alt="me" className="w-full h-full object-cover" />
                </div>
              </Link>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary text-xs px-4 py-2">Log in</Link>
          )}
        </div>
      </header>
 
      {/* ── Desktop: left sidebar (Discord style) ─── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40"
        style={{ width:220, background:'var(--bg-elevated)', borderRight:'1px solid var(--border-subtle)', padding:'28px 16px' }}>
 
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-10">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
            <img src="/logo.png" alt="meetifyy logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-[18px] tracking-tight uppercase" style={{ color:'var(--text-primary)' }}>meetifyy</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ href, label, Icon, badge }) => {
            if (href === '/profile' && !user) return null;
            const active = isActive(href);
            return (
              <Link key={href} href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-100 group"
                style={{
                  background: active ? 'var(--bg-active)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                <div className="flex items-center gap-3">
                  <Icon size={17} strokeWidth={active ? 2.5 : 1.75}
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)', transition:'color 0.1s' }} />
                  <span style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
                </div>
                {badge && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: 99 }}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card + theme toggle at bottom */}
        <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:16, marginTop:16 }}>
          {user ? (
            <Link href="/profile"
              className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all"
              style={{ ':hover': { background: 'var(--bg-hover)' } }}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border-mid)' }}>
                <img src={getUserAvatarUrl(dbUser)} alt="me" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color:'var(--text-primary)' }}>{dbUser?.full_name || (user.email || 'user').split('@')[0]}</p>
                <p className="text-[10px] truncate" style={{ color:'var(--text-muted)' }}>{user.role === 'admin' ? '🛡️ Admin' : 'View Profile'}</p>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary w-full justify-center py-2.5">
              <LogIn size={14} /> Log in
            </Link>
          )}
          <div className="mt-3 flex items-center justify-between px-2">
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ── Mobile: frosted bottom tab bar ────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex"
        style={{ 
          background: 'var(--bg-surface)', 
          borderTop: '2px solid var(--border-mid)',
          height: 'calc(60px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)'
        }}>
        {MOBILE_NAV.map(({ href, label, Icon }) => {
          if ((href === '/profile' || href === '/wallet' || href === '/messages') && !user) {
            return (
              <Link key={href} href="/login" className="flex-1 flex flex-col items-center justify-center gap-[3px]" style={{ color:'var(--text-muted)' }}>
                <LogIn size={18} strokeWidth={1.75} />
                <span className="text-[9px] font-semibold">{label === 'Profile' ? 'Login' : label}</span>
              </Link>
            );
          }
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] nav-dot"
              style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
              data-active={active || undefined}>
              <Icon size={19} strokeWidth={active ? 2.5 : 1.75} className={active ? 'active' : ''} />
              <span className="text-[9px]" style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
