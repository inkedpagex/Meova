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

const AUTH_PATHS = ['/login', '/signup'];

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

    // Listen to conversations where the user has unread messages
    // Pattern: messages/{conversationId}/msgs where read=false and senderId != user.id
    // Simpler: poll /api/messages/unread or use a denormalized counter
    // For now: listen to user's message_unread counter doc
    try {
      const { doc: firestoreDoc, onSnapshot: firestoreOnSnapshot } = require('firebase/firestore');
      const counterRef = firestoreDoc(db, 'users', user.id, 'meta', 'unread');
      const unsub = firestoreOnSnapshot(counterRef, (snap) => {
        if (snap.exists()) {
          const count = snap.data()?.messages || 0;
          setUnreadMsgCount(isOnMessagesPage ? 0 : count);
        }
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
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-[60px] flex items-center justify-between px-4"
        style={{ background: '#ffffff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        
        <Link href="/" className="flex items-center gap-2">
          <MeetifyLogo size={28} animate={logoAnimating} />
          <span className="font-black text-[17px] tracking-tight text-zinc-900">meetifyy</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              {!isAdminRoute && (
                <Link href="/wallet" className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black"
                  style={{ background: '#f3f0ff', color: '#7c3aed' }}>
                  <Zap size={11} className="fill-current" />
                  <span>{sparks.toLocaleString()}</span>
                </Link>
              )}

              {/* Messages icon with badge */}
              <Link href="/messages" className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: '#f8f8fa', border: '1px solid #e8e8ea' }}>
                <MessageSquare size={16} className={unreadMsgCount > 0 ? 'text-[#7c3aed]' : 'text-zinc-600'} strokeWidth={2} />
                {unreadMsgCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-[#7c3aed] border-2 border-white flex items-center justify-center text-[8px] font-black text-white px-0.5">
                    {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                  </span>
                )}
              </Link>

              <Link href="/bookings" className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: '#f8f8fa', border: '1px solid #e8e8ea' }}>
                <Calendar size={16} className={pathname === '/bookings' ? 'text-[#7c3aed]' : 'text-zinc-600'} strokeWidth={2} />
              </Link>

              <Link href="/notifications" className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: '#f8f8fa', border: '1px solid #e8e8ea' }}>
                <Bell size={16} className={unreadCount > 0 ? 'text-[#7c3aed]' : 'text-zinc-600'} strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#7c3aed] border-2 border-white flex items-center justify-center text-[9px] font-black text-white px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>


              <Link href="/profile">
                <div className="w-8 h-8 rounded-full overflow-hidden relative" style={{ border: '2px solid #e8e8ea' }}>
                  <Image src={avatarSrc} alt="me" fill sizes="32px" style={{ objectFit: 'cover' }} />
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

        <Link href="/" className="flex items-center gap-2.5 px-2 mb-10">
          <MeetifyLogo size={32} animate={logoAnimating} />
          <span className="font-black text-[18px] tracking-tight text-zinc-900">meetifyy</span>
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
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: active ? '#f3f0ff' : 'transparent', color: active ? '#7c3aed' : '#71717a' }}>
                <div className="flex items-center gap-3 relative">
                  <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
                  <span style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
                </div>
                {hasUnread && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-[#7c3aed] text-white text-[10px] font-black flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {hasUnreadMsgs && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-[#7c3aed] text-white text-[10px] font-black flex items-center justify-center px-1">
                    {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                  </span>
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
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative" style={{ border: '1.5px solid #e8e8ea' }}>
                <Image src={avatarSrc} alt="me" fill sizes="32px" style={{ objectFit: 'cover' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate text-zinc-900">{user.full_name || (user.email || 'user').split('@')[0]}</p>
                <p className="text-[10px] truncate text-zinc-400">
                  {isAdminRoute ? 'Super Admin' : `${user.year || '1st'} · ${user.branch || 'General'}`}
                </p>
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-end justify-around bg-white/75 backdrop-blur-xl"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.2)',
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
