'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Search, Users, User, LogIn, Wallet, Shield, Plus, Bell, Zap, MessageSquare,
  LayoutDashboard, CreditCard, ArrowUpRight, ShieldCheck, FileText, Settings, MoreHorizontal, Calendar, BookOpen
} from 'lucide-react';
import { getUserAvatarUrl } from '../utils/avatar';
import { db } from '../lib/firebaseClient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const AUTH_PATHS = ['/login', '/signup', '/onboarding'];

function MeetifyLogo({ size = 32, animate = false }) {
  return (
    <div
      className={animate ? 'logo-ring-animation' : ''}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: animate
          ? '0 0 0 4px rgba(124,58,237,0.25), 0 2px 8px rgba(124,58,237,0.3)'
          : '0 2px 8px rgba(124,58,237,0.3)',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname.startsWith('/admin');

  const [sparks, setSparks] = useState(
    user?.wallet ? (user.wallet.purchased || 0) + (user.wallet.bonus || 0) + (user.wallet.creator || 0) : 0
  );

  // ── Notification state ─────────────────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0); // Unread messages badge
  const [logoAnimating, setLogoAnimating] = useState(false);
  const prevCountRef = useRef(0);
  const prevMsgCountRef = useRef(0);
  const isOnNotifPage = pathname === '/notifications';

  // Notification loader
  useEffect(() => {
    if (!user?.id) return;

    let unsub = null;
    let pollInterval = null;

    const fetchApiCount = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        const count = data.unreadCount || 0;
        setUnreadCount(count);
        if (count > prevCountRef.current && prevCountRef.current !== 0) {
          setLogoAnimating(true);
          setTimeout(() => setLogoAnimating(false), 2000);
        }
        prevCountRef.current = count;
      } catch { /* silent */ }
    };

    fetchApiCount();

    if (db) {
      try {
        const notifRef = collection(db, 'users', user.id, 'notifications');
        const q = query(notifRef, where('read', '==', false));

        unsub = onSnapshot(q, (snap) => {
          const count = snap.size;
          setUnreadCount(count);
          if (count > prevCountRef.current && prevCountRef.current !== 0) {
            setLogoAnimating(true);
            setTimeout(() => setLogoAnimating(false), 2000);
          }
          prevCountRef.current = count;
        }, () => {
          if (!pollInterval) {
            pollInterval = setInterval(fetchApiCount, 15000);
          }
        });
      } catch {
        pollInterval = setInterval(fetchApiCount, 15000);
      }
    } else {
      pollInterval = setInterval(fetchApiCount, 15000);
    }

    return () => {
      if (unsub) unsub();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [user?.id]);

  useEffect(() => {
    if (isOnNotifPage && unreadCount > 0 && user?.id) {
      fetch('/api/notifications', { method: 'PATCH' })
        .then(() => setUnreadCount(0))
        .catch(() => {});
    }
  }, [isOnNotifPage]);

  // ── Unread Messages listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !db) return;
    const isOnMessagesPage = pathname === '/messages';

    // Request Notification permission for PWA if not already granted/denied
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.id)
      );

      const unsub = onSnapshot(q, (snap) => {
        let totalUnread = 0;
        
        snap.forEach(d => {
          const data = d.data();
          const count = data.unreadCount?.[user.id] || 0;
          totalUnread += count;
        });

        setUnreadMsgCount(isOnMessagesPage ? 0 : totalUnread);

        // Trigger PWA notification if count goes up (new message received)
        if (totalUnread > prevMsgCountRef.current && prevMsgCountRef.current !== 0 && !isOnMessagesPage) {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message on Meetify', {
              body: 'You received a new message from a campus student.',
              icon: '/icon-192.png',
              badge: '/icon-192.png',
            });
          }
        }
        
        prevMsgCountRef.current = totalUnread;
      }, () => {});
      
      return () => unsub();
    } catch { /* graceful fail */ }
  }, [user?.id, pathname]);

  // ── Wallet sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch('/api/wallet');
        if (!res.ok) return;
        const data = await res.json();
        const w = data.wallet;
        if (w) setSparks((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
      } catch { /* silent */ }
    };

    if (user && typeof window !== 'undefined') {
      sync();
      window.addEventListener('wallet-updated', sync);
      return () => window.removeEventListener('wallet-updated', sync);
    }
  }, [user]);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const NAV = [
    { href: '/',              label: 'Home',          Icon: Home },
    { href: '/discover',      label: 'Discover',      Icon: Search },
    { href: '/messages',      label: 'Messages',      Icon: MessageSquare },
    { href: '/bookings',      label: 'My Bookings',   Icon: Calendar },
    { href: '/notifications', label: 'Notifications', Icon: Bell },
    { href: '/circles',       label: 'Communities',   Icon: Users },
    ...(user ? [{ href: '/wallet', label: 'Wallet', Icon: Wallet }] : []),
    { href: '/profile',       label: 'Profile',       Icon: User },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: Shield }] : []),
  ];

  const MOBILE_NAV = [
    { href: '/',         label: 'Home',     Icon: Home },
    { href: '/discover', label: 'Discover', Icon: Search },
    { href: '/create',   label: 'Plus',     Icon: Plus, isCenter: true },
    { href: '/bookings', label: 'Bookings', Icon: Calendar },
    { href: '/profile',  label: 'Profile',  Icon: User },
  ];

  const avatarSrc = getUserAvatarUrl(user);

  if (AUTH_PATHS.includes(pathname)) return null;

  return (
    <>
      <style>{`
        @keyframes logo-ring {
          0%   { transform: rotate(0deg) scale(1); }
          15%  { transform: rotate(-12deg) scale(1.1); }
          30%  { transform: rotate(10deg) scale(1.1); }
          45%  { transform: rotate(-8deg) scale(1.05); }
          60%  { transform: rotate(6deg) scale(1.05); }
          75%  { transform: rotate(-4deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
        .logo-ring-animation {
          animation: logo-ring 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          animation-iteration-count: 2;
        }
      `}</style>

      {/* ── Mobile top header ────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-[58px] flex items-center justify-between px-4 bg-white/90 backdrop-blur-xl border-b border-zinc-100 shadow-2xs">
        
        <Link href="/" className="flex items-center gap-2 group">
          <MeetifyLogo size={28} animate={logoAnimating} />
          <span className="font-black text-lg tracking-tight text-zinc-900">
            meetifyy
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {!isAdminRoute && (
                <Link 
                  href="/wallet" 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-100/80 hover:bg-purple-100/70 transition-all active:scale-95"
                >
                  <Zap size={13} className="fill-purple-600 text-purple-600" />
                  <span>{sparks.toLocaleString()}</span>
                </Link>
              )}

              {/* Notifications */}
              <Link 
                href="/notifications" 
                className={`relative p-2 rounded-full transition-all ${
                  pathname === '/notifications' 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
                title="Notifications"
              >
                <Bell size={20} className={unreadCount > 0 ? 'text-purple-600 fill-purple-100' : ''} strokeWidth={2.2} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-white" />
                )}
              </Link>

              {/* Messages */}
              <Link 
                href="/messages" 
                className={`relative p-2 rounded-full transition-all ${
                  pathname === '/messages' 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
                title="Messages"
              >
                <MessageSquare size={20} className={unreadMsgCount > 0 ? 'text-purple-600 fill-purple-100' : ''} strokeWidth={2.2} />
                {unreadMsgCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-white" />
                )}
              </Link>
            </>
          ) : (
            <Link 
              href="/login"
              className="px-4 py-1.5 rounded-full text-xs font-black text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all shadow-2xs"
            >
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* ── Desktop sidebar ──────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40"
        style={{ width: 220, background: '#ffffff', borderRight: '1px solid #f0f0f0', padding: '28px 16px' }}>

        <Link href="/" className="flex items-center gap-2.5 px-2 mb-10">
          <MeetifyLogo size={32} animate={logoAnimating} />
          <span className="font-black text-[18px] tracking-tight bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 bg-clip-text text-transparent">meetifyy</span>
        </Link>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            if (href === '/profile' && !user) return null;
            const active = isActive(href);
            const isNotif = label === 'Notifications';
            const hasUnread = isNotif && unreadCount > 0;
            const isMessages = label === 'Messages';
            const hasUnreadMsgs = isMessages && unreadMsgCount > 0;

            return (
              <Link key={href} href={href}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: active ? '#f3f0ff' : 'transparent', color: active ? '#7c3aed' : '#71717a' }}>
                <div className="flex items-center gap-3 relative">
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
                  <span style={{ fontWeight: active ? 800 : 500 }}>{label}</span>
                </div>
                {hasUnread && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-2xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {hasUnreadMsgs && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-2xs">
                    {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                  </span>
                )}
                {label === 'Wallet' && sparks > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {sparks.toLocaleString()}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
          {user ? (
            <Link href="/profile" className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all hover:bg-purple-50/50 group">
              <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-purple-600 to-indigo-500 flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden relative border border-white">
                  <Image src={avatarSrc} alt="me" fill sizes="36px" style={{ objectFit: 'cover' }} />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black truncate text-zinc-900 group-hover:text-purple-600 transition-colors">{user.full_name || (user.email || 'user').split('@')[0]}</p>
                <p className="text-[10px] truncate text-zinc-400 font-semibold">
                  {isAdminRoute ? 'Super Admin' : `${user.year || '1st'} · ${user.branch || 'General'}`}
                </p>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-xs">
              <LogIn size={14} /> Log in
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ───────────── */}
      <nav 
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around bg-white/90 backdrop-blur-2xl border-t border-zinc-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        style={{
          height: 'calc(62px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {MOBILE_NAV.map(({ href, label, Icon, isCenter }) => {
          if ((href === '/profile') && !user) {
            return (
              <Link key={href} href="/login" className="flex-1 flex flex-col items-center justify-center h-full text-zinc-400 hover:text-purple-600 transition-colors">
                <LogIn size={20} strokeWidth={2} />
                <span className="text-[10px] font-black mt-0.5">Login</span>
              </Link>
            );
          }
          const active = isActive(href);

          if (isCenter) {
            return (
              <Link 
                key={href} 
                href={href}
                className="flex-1 flex flex-col items-center justify-center relative -top-3 h-full select-none"
                style={{ zIndex: 60 }}
              >
                <div className="w-13 h-13 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-[0_8px_20px_rgba(124,58,237,0.4)] active:scale-90 transition-all ring-4 ring-white">
                  <Plus size={24} strokeWidth={2.8} />
                </div>
              </Link>
            );
          }

          return (
            <Link 
              key={href} 
              href={href}
              className={`flex-1 flex flex-col items-center justify-center h-full relative select-none transition-all ${
                active ? 'text-purple-600' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all ${active ? 'bg-purple-50/90 text-purple-600' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.6 : 1.9} />
              </div>
              <span className={`text-[10px] font-black -mt-0.5 tracking-tight ${active ? 'text-purple-600' : 'text-zinc-400'}`}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
