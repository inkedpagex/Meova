'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';
import { supabase } from '../lib/supabase/client';
import { useUserContext } from './providers/UserProvider';
import CreateMenuModal from './CreateMenuModal';

/* Remix Icon helper — renders a single ri-* icon */
const RiIcon = ({ name, size = 20, className = '' }) => (
  <i className={`${name} ${className}`} style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
);


const AUTH_PATHS = ['/login', '/signup', '/onboarding', '/terms', '/privacy', '/offline', '/gla-university'];

export default function Sidebar({ user: propUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: contextUser, wallet, refreshWallet } = useUserContext();
  const user = contextUser || propUser;
  const currentUserId = user?.id || user?.uid;
  const isAdminRoute = pathname.startsWith('/admin');
  const [pendingPath, setPendingPath] = useState(null);

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

  // ── Wallet real-time listener & API fetch ──────────────────────────────────
  const fetchWalletBalance = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch('/api/wallet');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.wallet) {
        const w = data.wallet;
        const total = (w.purchased || 0) + (w.bonus || 0) + (w.creator || 0);
        setSparks(total);
      }
    } catch { /* silent */ }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    fetchWalletBalance();

    const handleWalletUpdated = () => {
      fetchWalletBalance();
    };

    window.addEventListener('wallet-updated', handleWalletUpdated);
    window.addEventListener('focus', handleWalletUpdated);

    let channel = null;
    if (supabase) {
      channel = supabase
        .channel(`sidebar-wallet-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${currentUserId}`,
          },
          () => {
            fetchWalletBalance();
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdated);
      window.removeEventListener('focus', handleWalletUpdated);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchWalletBalance]);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const NAV = [
    { href: '/',              label: 'Home',          iconLine: 'ri-home-5-line',          iconFill: 'ri-home-5-fill' },
    { href: '/discover',      label: 'Discover',      iconLine: 'ri-compass-3-line',        iconFill: 'ri-compass-3-fill' },
    { href: '/messages',      label: 'Messages',      iconLine: 'ri-chat-3-line',           iconFill: 'ri-chat-3-fill' },
    { href: '/bookings',      label: 'My Bookings',   iconLine: 'ri-calendar-schedule-line', iconFill: 'ri-calendar-schedule-fill', badge: pendingBookingsCount },
    { href: '/notifications', label: 'Notifications', iconLine: 'ri-notification-3-line',   iconFill: 'ri-notification-3-fill' },
    { href: '/circles',       label: 'Communities',   iconLine: 'ri-group-3-line',          iconFill: 'ri-group-3-fill' },
    ...(user ? [{ href: '/wallet', label: 'Wallet', iconLine: 'ri-wallet-3-line', iconFill: 'ri-wallet-3-fill' }] : []),
    { href: '/profile',       label: 'Profile',       iconLine: 'ri-user-3-line',           iconFill: 'ri-user-3-fill' },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', iconLine: 'ri-shield-star-line', iconFill: 'ri-shield-star-fill' }] : []),
  ];

  const MOBILE_NAV = [
    { href: '/',         label: 'Home',     iconLine: 'ri-home-5-line',    iconFill: 'ri-home-5-fill' },
    { href: '/discover', label: 'Discover', iconLine: 'ri-compass-3-line',  iconFill: 'ri-compass-3-fill' },
    { href: '/create',   label: 'Plus',     iconLine: 'ri-add-line',        iconFill: 'ri-add-fill', isCenter: true },
    { href: '/bookings', label: 'Bookings', iconLine: 'ri-calendar-schedule-line', iconFill: 'ri-calendar-schedule-fill', badge: pendingBookingsCount },
    { href: '/profile',  label: 'Profile',  iconLine: 'ri-user-3-line',    iconFill: 'ri-user-3-fill' },
  ];


  const avatarSrc = getUserAvatarUrl(user);

  if (AUTH_PATHS.includes(pathname)) return null;

  return (
    <>
      {/* ── Mobile top header ────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-[58px] flex items-center justify-between px-4 bg-white/95 backdrop-blur-xl border-b border-neutral-100 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="Meova" className="h-9 w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {!isAdminRoute && (
                <Link 
                  href="/wallet" 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-orange-50 text-[#F05A00] border border-orange-100 hover:bg-orange-100 transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <i className="ri-flashlight-fill" style={{ fontSize: 13, color: '#F05A00' }} />
                  <span className="tabular-nums font-black">{sparks.toLocaleString()}</span>
                </Link>
              )}

              {/* Notifications */}
              <Link 
                href="/notifications" 
                className={`relative p-2 rounded-full transition-all ${
                  pathname === '/notifications' 
                    ? 'text-[#F05A00] bg-orange-50' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                title="Notifications"
              >
                <i className={`${ unreadCount > 0 ? 'ri-notification-3-fill text-[#F05A00]' : pathname === '/notifications' ? 'ri-notification-3-fill' : 'ri-notification-3-line' }`} style={{ fontSize: 20 }} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[#F05A00] text-white text-[8px] font-black border border-white px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Messages */}
              <Link 
                href="/messages" 
                className={`relative p-2 rounded-full transition-all ${
                  pathname === '/messages' 
                    ? 'text-[#F05A00] bg-orange-50' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                title="Messages"
              >
                <i className={`${ unreadMsgCount > 0 ? 'ri-chat-3-fill text-[#F05A00]' : pathname === '/messages' ? 'ri-chat-3-fill' : 'ri-chat-3-line' }`} style={{ fontSize: 20 }} />
                {unreadMsgCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[#F05A00] text-white text-[8px] font-black border border-white px-0.5">
                    {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <Link 
              href="/login"
              className="px-4 py-1.5 rounded-full text-xs font-black text-white bg-[#F05A00] hover:bg-[#D94F00] active:scale-95 transition-all shadow-sm"
            >
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* ── Desktop sidebar ──────────────────── */}
      <aside 
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-300 select-none bg-white border-r border-neutral-100"
        style={{ 
          width: isCollapsed ? 72 : 230, 
          padding: isCollapsed ? '24px 10px' : '24px 16px' 
        }}
      >
        <div className={`flex items-center mb-8 ${isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between px-1'}`}>
          {isCollapsed ? (
            <>
              <Link href="/" className="flex items-center justify-center hover:scale-105 transition-transform" title="Meova">
                <img src="/logo.png" alt="Meova" className="w-8 h-8 object-contain" />
              </Link>
              <button 
                onClick={toggleCollapse} 
                title="Expand Sidebar"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#F05A00] hover:bg-orange-50 transition-colors cursor-pointer"
              >
                <i className="ri-layout-left-2-line" style={{ fontSize: 18 }} />
              </button>
            </>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-2 min-w-0">
                <img src="/logo.png" alt="Meova" className="h-11 w-auto object-contain" />
              </Link>
              <button 
                onClick={toggleCollapse} 
                title="Collapse Sidebar"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer flex-shrink-0"
              >
                <i className="ri-layout-left-line" style={{ fontSize: 18 }} />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {NAV.map(({ href, label, iconLine, iconFill, badge }) => {
            if (href === '/profile' && !user) return null;
            const active = pendingPath ? pendingPath === href : isActive(href);
            const isNotif = label === 'Notifications';
            const hasUnread = isNotif && unreadCount > 0;
            const isMessages = label === 'Messages';
            const hasUnreadMsgs = isMessages && unreadMsgCount > 0;
            const hasBadge = badge && badge > 0;

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
                  className={`relative flex items-center justify-center w-12 h-11 mx-auto rounded-xl outline-none focus:outline-none active:outline-none transition-all active:scale-90 ${
                    active 
                      ? 'bg-orange-50 text-[#F05A00] border border-orange-200/60 shadow-xs' 
                      : 'text-black/70 hover:text-black hover:bg-orange-50/50'
                  }`}
                >
                  <i className={active ? iconFill : iconLine} style={{ fontSize: 20 }} />
                  {(hasUnread || hasUnreadMsgs || hasBadge) && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#F05A00] ring-2 ring-white" />
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-bold outline-none focus:outline-none active:outline-none transition-all active:scale-95 ${
                  active 
                    ? 'bg-orange-50 text-[#F05A00] border border-orange-200/60 font-black shadow-xs' 
                    : 'text-black/75 hover:text-black hover:bg-orange-50/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <i className={`${active ? iconFill : iconLine} flex-shrink-0`} style={{ fontSize: 18 }} />
                  <span className="truncate">{label}</span>
                </div>
                {hasUnread && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-[#F05A00] text-white text-[10px] font-black flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {hasUnreadMsgs && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-[#F05A00] text-white text-[10px] font-black flex items-center justify-center px-1">
                    {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                  </span>
                )}
                {hasBadge && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-[#F05A00] text-white text-[10px] font-black flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {label === 'Wallet' && sparks > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#F05A00] border border-orange-100">
                    {sparks.toLocaleString()}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile / Login */}
        <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: 16, marginTop: 12 }}>
          {user ? (
            <Link 
              href="/profile" 
              title={user.full_name || 'Profile'}
              className={`flex items-center gap-2.5 p-2 rounded-xl transition-all hover:bg-orange-50/50 group ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full p-[1.5px] bg-[#F05A00] flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden relative border border-white">
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
                  <p className="text-xs font-black truncate text-neutral-900 group-hover:text-[#F05A00] transition-colors">
                    {user.full_name || (user.email || 'user').split('@')[0]}
                  </p>
                  <p className="text-[10px] truncate text-neutral-400 font-semibold">
                    {isAdminRoute ? 'Super Admin' : `${user?.year ? (user.year.includes('Year') ? user.year : `${user.year} Year`) : '1st Year'} · ${user.branch || 'General'}`}
                  </p>
                </div>
              )}
            </Link>
          ) : (
            <Link 
              href="/login" 
              title="Log in"
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white bg-[#F05A00] hover:bg-[#D94F00] transition-all ${
                isCollapsed ? 'px-0' : 'px-4'
              }`}
            >
              <i className="ri-login-circle-line" style={{ fontSize: 15 }} /> {!isCollapsed && <span>Log in</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ───────────────── */}
      {!(AUTH_PATHS.includes(pathname) || pathname?.startsWith('/admin') || isKeyboardOpen) && (
        <nav 
          suppressHydrationWarning
          className="md:hidden hide-on-keyboard fixed bottom-0 inset-x-0 z-50 flex items-center justify-around bg-white/95 backdrop-blur-xl border-t border-black/10 shadow-[0_-4px_25px_rgba(0,0,0,0.03)]"
          style={{
            height: 'calc(62px + env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
        {MOBILE_NAV.map(({ href, label, iconLine, iconFill, isCenter }) => {
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
                className="flex-1 flex flex-col items-center justify-center h-full text-black/65 hover:text-[#F05A00] transition-colors active:scale-90"
              >
                <i className="ri-login-circle-line" style={{ fontSize: 20 }} />
                <span className="text-[10.5px] font-black mt-0.5">Login</span>
              </Link>
            );
          }
          const active = pendingPath ? pendingPath === href : isActive(href);

          if (isCenter) {
            return (
              <button 
                key={href} 
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    try { navigator.vibrate(15); } catch {}
                  }
                  setShowCreateModal(true);
                }}
                className="flex-1 flex flex-col items-center justify-center relative -top-3 h-full select-none outline-none cursor-pointer"
                style={{ zIndex: 60 }}
              >
                <div 
                  suppressHydrationWarning
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-[#F05A00] hover:bg-[#D94F00] shadow-[0_6px_20px_rgba(240,90,0,0.4)] active:scale-90 transition-all ring-4 ring-white"
                >
                  <i className="ri-add-line" style={{ fontSize: 24, fontWeight: 900 }} />
                </div>
              </button>
            );
          }

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
              className={`flex-1 flex flex-col items-center justify-center h-full relative select-none outline-none focus:outline-none active:outline-none transition-all active:scale-90 ${
                active ? 'text-[#F05A00]' : 'text-black/65 hover:text-black'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${active ? 'bg-orange-50 text-[#F05A00] scale-105' : ''}`}>
                <i className={active ? iconFill : iconLine} style={{ fontSize: 20 }} />
              </div>
              <span className={`text-[10px] font-black tracking-tight mt-0.5 ${active ? 'text-[#F05A00]' : 'text-black/65'}`}>
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
