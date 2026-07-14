'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, User, LogIn, Calendar, Wallet, Shield, Plus, MessageSquare } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ user }) {
  const pathname = usePathname();

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const totalSparks = user?.wallet
    ? (user.wallet.purchased || 0) + (user.wallet.bonus || 0) + (user.wallet.creator || 0)
    : 0;

  const NAV = [
    { href: '/',        label: 'Home',     Icon: Home },
    { href: '/discover',label: 'Discover', Icon: Compass },
    { href: '/events',  label: 'Events',   Icon: Calendar },
    { href: '/circles', label: 'Circles',  Icon: Users },
    { href: '/messages',label: 'Messages', Icon: MessageSquare },
    ...(user ? [{ href: '/wallet',  label: 'Wallet',   Icon: Wallet, badge: `${totalSparks.toLocaleString()} ⚡` }] : []),
    { href: '/profile', label: 'Profile',  Icon: User },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: Shield }] : []),
  ];

  return (
    <>
      {/* ── Mobile: frosted top header ────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-[56px] flex items-center justify-between px-5"
        style={{ background:'rgba(8,8,8,0.8)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <span className="text-black font-black text-[15px] leading-none">M</span>
          </div>
          <span className="font-extrabold text-[17px] text-white tracking-[-0.5px]">meetuply</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/wallet" className="glass flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                <span>{totalSparks.toLocaleString()}</span>
                <span className="text-[#fb923c]">⚡</span>
              </Link>
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '1px solid var(--border-mid)', background: 'var(--bg-overlay)' }}>
                  <img src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(user.email||'u')}`} alt="me" className="w-full h-full" />
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
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
            <span className="text-black font-black text-[18px] leading-none">M</span>
          </div>
          <span className="font-extrabold text-[18px] tracking-[-0.5px]" style={{ color:'var(--text-primary)' }}>meetuply</span>
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
                <img src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(user.email||'u')}`} alt="me" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color:'var(--text-primary)' }}>{(user.email || 'user').split('@')[0]}</p>
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-[60px] flex"
        style={{ background:'rgba(8,8,8,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        {NAV.slice(0, 5).map(({ href, label, Icon }) => {
          if (href === '/profile' && !user) {
            return (
              <Link key="login" href="/login" className="flex-1 flex flex-col items-center justify-center gap-[3px]" style={{ color:'var(--text-muted)' }}>
                <LogIn size={18} strokeWidth={1.75} />
                <span className="text-[9px] font-semibold">Login</span>
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
