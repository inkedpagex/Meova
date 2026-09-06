'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';
import { supabase } from '../lib/supabase/client';
import { useUserContext } from './providers/UserProvider';
import CreateMenuModal from './CreateMenuModal';
import Logo from './Logo';

import { 
  Home, 
  Compass, 
  MessageSquare, 
  Bell, 
  User as UserIcon, 
  Wallet,
  Shield, 
  Award,
  PanelLeft, 
  PanelLeftClose, 
  Plus, 
  Zap, 
  LogIn 
} from '@/lib/icons';


const AUTH_PATHS = [
  '/login',
  '/signup',
  '/onboarding',
  '/terms',
  '/privacy',
  '/refund-policy',
  '/community-guidelines',
  '/grievance',
  '/about',
  '/contact',
  '/offline',
  '/gla-university',
  '/ambassador',
  '/help',
  '/blog',
];

export default function Sidebar({ user: propUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: contextUser, wallet, refreshWallet } = useUserContext();
  const user = contextUser || propUser;
  const currentUserId = user?.id || user?.uid;
  const isAdminRoute = pathname.startsWith('/admin');
  const [pendingPath, setPendingPath] = useState(null);

  const [isStandaloneHost, setIsStandaloneHost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      const isIsolatedSub = h.startsWith('ambassador.') || h.startsWith('admin.');
      const isPublicAmbassadorPage = window.location.pathname === '/ambassador';
      const isCollegePage = window.location.pathname.startsWith('/college/');
      const isContentPage =
        window.location.pathname.startsWith('/blog') ||
        window.location.pathname.startsWith('/help') ||
        AUTH_PATHS.includes(window.location.pathname);
      const isRootMarketing = window.location.pathname === '/' && !currentUserId;
      if (isIsolatedSub || isPublicAmbassadorPage || isCollegePage || isContentPage || isRootMarketing) {
        setIsStandaloneHost(true);
      } else {
        setIsStandaloneHost(false);
      }
    }
  }, [pathname, currentUserId]);

  const isPublicStandalone =
    (pathname === '/' && !currentUserId) ||
    pathname === '/ambassador' ||
    pathname.startsWith('/college/') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/help') ||
    AUTH_PATHS.includes(pathname);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  const initialSparks = wallet
    ? (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0)
    : (user?.wallet ? (user.wallet.purchased || 0) + (user.wallet.bonus || 0) + (user.wallet.creator || 0) : 0);

  const [sparks, setSparks] = useState(initialSparks);

  useEffect(() => {
    if (wallet) {
      const total = (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0);
      setSparks(total);
    }
  }, [wallet]);

  // ── Sidebar collapse state ──────────────────────────────────────────────────
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved === 'true') setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', nextState ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('sidebar-collapsed-change', { detail: { collapsed: nextState } }));
    }
  };

  // ── Notification state ─────────────────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const prevCountRef = useRef(0);
  const prevMsgCountRef = useRef(0);
  const isOnNotifPage = pathname === '/notifications';

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleFocus = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') setIsKeyboardOpen(true);
    };
    const handleBlur = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') setIsKeyboardOpen(false);
    };
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Notification Realtime Channel & Initial Fetch
  const fetchApiCount = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      const count = data.unreadCount || 0;
      setUnreadCount(count);
      prevCountRef.current = count;
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!user?.id || !supabase) return;

    fetchApiCount();

    const channel = supabase
      .channel(`sidebar-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchApiCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (isOnNotifPage && unreadCount > 0 && user?.id) {
      fetch('/api/notifications', { method: 'PATCH' })
        .then(() => setUnreadCount(0))
        .catch(() => {});
    }
  }, [isOnNotifPage]);

  // ── Unread Messages listener via Supabase Realtime ──────────────────────────
  const pollUnread = async () => {
    if (!user?.id) return;
    const isOnMessagesPage = pathname === '/messages';
    try {
      const res = await fetch('/api/chats');
      if (!res.ok) return;
      const data = await res.json();
      let total = 0;
      (data.chats || []).forEach(c => {
        const counts = c.unread_count || c.unreadCount || {};
        total += (counts[user.id] || 0);
      });
      setUnreadMsgCount(isOnMessagesPage ? 0 : total);
      prevMsgCountRef.current = total;
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!user?.id || !supabase) return;

    pollUnread();

    const channel = supabase
      .channel(`sidebar-chats-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          pollUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, pathname]);

  // ── Pending Bookings listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const fetchPendingBookings = async () => {
      try {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('host_id', user.id)
          .eq('status', 'Requested');
        setPendingBookingsCount(count || 0);
      } catch {}
    };

    fetchPendingBookings();

    const channel = supabase
      .channel(`sidebar-bookings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `host_id=eq.${user.id}`,
        },
        () => {
          fetchPendingBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);


  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const NAV = [
    { href: '/',              label: 'Home',          Icon: Home },
    { href: '/discover',      label: 'Discover',      Icon: Compass },
    { href: '/messages',      label: 'Messages',      Icon: MessageSquare, badge: unreadMsgCount },
    { href: '/notifications', label: 'Notifications', Icon: Bell, badge: unreadCount },
    { href: '/wallet',        label: 'Wallet',        Icon: Wallet },
    { href: '/profile',       label: 'Profile',       Icon: UserIcon },
    ...(user?.is_ambassador === true ? [{ href: '/ambassador/dashboard', label: 'Ambassador', Icon: Award }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', Icon: Shield }] : []),
  ];

  const MOBILE_NAV = [
    { href: '/',              label: 'Home',          Icon: Home },
    { href: '/discover',      label: 'Discover',      Icon: Compass },
    { href: '/messages',      label: 'Messages',      Icon: MessageSquare, badge: unreadMsgCount },
    { href: '/notifications', label: 'Notifications', Icon: Bell, badge: unreadCount },
    { href: '/profile',       label: 'Profile',       Icon: UserIcon },
  ];

  const avatarSrc = getUserAvatarUrl(user);

  if (isPublicStandalone || isStandaloneHost || AUTH_PATHS.includes(pathname)) return null;

  return (
    <>
      {/* ── Mobile top header (Blueprint Section 2) ────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-[56px] flex items-center justify-between px-3.5 bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] shadow-xs">
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
              {/* Top-Right Create Post / Plus CTA */}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-8.5 h-8.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] hover:bg-black/5 active:scale-95 transition-all cursor-pointer shadow-2xs flex-shrink-0"
                title="Create Post / Story"
              >
                <Plus size={17} strokeWidth={2.2} />
              </button>

              {/* Wallet Pill */}
              <Link 
                href="/wallet" 
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] hover:bg-black/5 hover:border-black/20 transition-all active:scale-95 shadow-2xs whitespace-nowrap flex-shrink-0"
              >
                <Zap size={12} strokeWidth={2} className="fill-amber-500 text-amber-500 flex-shrink-0" />
                <span className="tabular-nums font-bold leading-none">{sparks.toLocaleString()}</span>
              </Link>

              {/* Own Avatar */}
              <Link
                href="/profile"
                className="w-8.5 h-8.5 rounded-full overflow-hidden p-[1px] border border-[var(--border-hairline)] flex-shrink-0 relative active:scale-95 transition-transform bg-[var(--bg-surface)]"
              >
                <img
                  src={avatarSrc}
                  alt={user.full_name || 'Profile'}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getCartoonAvatar(user.full_name || user.id || 'user');
                  }}
                />
              </Link>
            </>
          ) : (
            <Link 
              href="/login" 
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-95 transition-all shadow-xs whitespace-nowrap flex-shrink-0"
            >
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* ── Desktop sidebar ──────────────────── */}
      <aside 
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-300 select-none bg-[var(--bg-surface)] border-r border-[var(--border-hairline)]"
        style={{ 
          width: isCollapsed ? 72 : 240, 
          padding: isCollapsed ? '24px 10px' : '24px 16px' 
        }}
      >
        <div className={`flex items-center mb-8 ${isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between px-1'}`}>
          {isCollapsed ? (
            <>
              <Link href="/" className="flex items-center justify-center hover:scale-105 transition-transform" title="Meova">
                <Logo size="sm" />
              </Link>
              <button 
                onClick={toggleCollapse} 
                title="Expand Sidebar"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <PanelLeft size={18} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-2 min-w-0">
                <Logo size="md" />
              </Link>
              <button 
                onClick={toggleCollapse} 
                title="Collapse Sidebar"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer flex-shrink-0"
              >
                <PanelLeft size={18} strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {NAV.map((item) => {
            const { href, label, Icon, badge } = item;
            if (href === '/profile' && !user) return null;
            const active = pendingPath ? pendingPath === href : isActive(href);
            const badgeCount = typeof badge === 'number' && badge > 0 ? badge : 0;
            const showBadge = badgeCount > 0;

            const handleLinkClick = (e) => {
              try { e?.currentTarget?.blur(); } catch {}
              setPendingPath(href);
              if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate(10); } catch {}
              }
            };

            if (isCollapsed) {
              return (
                <Link 
                  key={href} 
                  href={href}
                  prefetch={true}
                  onMouseDown={(e) => { try { e.currentTarget.blur(); } catch {} }}
                  onClick={handleLinkClick}
                  title={label}
                  className={`relative flex items-center justify-center w-12 h-11 mx-auto rounded-[12px] outline-none focus:outline-none active:outline-none transition-all active:scale-90 ${
                    active 
                      ? 'bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] shadow-xs' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                  {showBadge && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-surface)]" />
                  )}
                </Link>
              );
            }

            return (
              <Link 
                key={href} 
                href={href}
                prefetch={true}
                onMouseDown={(e) => { try { e.currentTarget.blur(); } catch {} }}
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-[13.5px] outline-none focus:outline-none active:outline-none transition-all active:scale-95 ${
                  active 
                    ? 'bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] font-semibold' 
                    : 'text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={19} strokeWidth={active ? 1.8 : 1.5} className="flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
                {showBadge && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-[var(--accent)] text-white text-[10px] font-semibold flex items-center justify-center px-1 flex-shrink-0">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
                {label === 'Wallet' && sparks > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex-shrink-0">
                    {sparks.toLocaleString()}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile */}
        <div className="pt-3 border-t border-[var(--border-hairline)] mt-2">
          {user ? (
            <Link 
              href="/profile" 
              title={user.full_name || 'Profile'}
              className={`flex items-center gap-2.5 p-2 rounded-[12px] transition-all hover:bg-[var(--bg-hover)] group ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full p-[1.5px] bg-[var(--border-hairline)] flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden relative border border-[var(--bg-surface)]">
                  <img 
                    src={avatarSrc} 
                    alt="me" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getCartoonAvatar(user?.full_name || user?.id || 'user');
                    }}
                  />
                </div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {user.full_name || (user.email || 'user').split('@')[0]}
                  </p>
                  <p className="text-[10px] truncate text-[var(--text-muted)] font-medium">
                    {isAdminRoute ? 'Super Admin' : `${user?.year ? (user.year.includes('Year') ? user.year : `${user.year} Year`) : '1st Year'} · ${user.branch || 'General'}`}
                  </p>
                </div>
              )}
            </Link>
          ) : (
            <Link 
              href="/login" 
              title="Log in"
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-xs ${
                isCollapsed ? 'px-0' : 'px-4'
              }`}
            >
              <LogIn size={15} strokeWidth={1.75} /> {!isCollapsed && <span>Log in</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom tab bar (Screen 1.23-1.28) ───────────────── */}
      {!(AUTH_PATHS.includes(pathname) || pathname?.startsWith('/admin') || isKeyboardOpen) && (
        <nav 
          suppressHydrationWarning
          className="md:hidden hide-on-keyboard fixed bottom-0 inset-x-0 z-50 flex items-center justify-around bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] shadow-[0_-1px_3px_rgba(0,0,0,0.02)]"
          style={{
            height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
        {MOBILE_NAV.map(({ href, label, Icon, badge }) => {
          if ((href === '/profile') && !user) {
            return (
              <Link
                key={href}
                href="/login"
                prefetch={true}
                onClick={() => {
                  setPendingPath('/login');
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    try { navigator.vibrate(10); } catch {}
                  }
                }}
                className="flex-1 flex flex-col items-center justify-center h-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors active:scale-95"
              >
                <div className="relative flex items-center justify-center">
                  <LogIn size={21} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-0.5">Login</span>
              </Link>
            );
          }
          const active = pendingPath ? pendingPath === href : isActive(href);
          const badgeCount = typeof badge === 'number' && badge > 0 ? badge : 0;
          const showDot = badgeCount > 0;

          return (
            <Link 
              key={href} 
              href={href}
              prefetch={true}
              onMouseDown={(e) => { try { e.currentTarget.blur(); } catch {} }}
              onClick={(e) => {
                try { e?.currentTarget?.blur(); } catch {}
                setPendingPath(href);
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate(10); } catch {}
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full relative select-none outline-none focus:outline-none active:outline-none transition-all active:scale-95 ${
                active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={21} strokeWidth={active ? 2.1 : 1.5} className="transition-all" />
                {showDot && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-surface)]" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 select-none transition-colors ${
                active ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)] font-medium'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
      )}
      
      <CreateMenuModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
