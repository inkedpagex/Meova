'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Search, Users, User, LogIn, Wallet, Shield, Plus, Bell, Zap, MessageSquare,
  LayoutDashboard, CreditCard, ArrowUpRight, ShieldCheck, FileText, Settings, MoreHorizontal, Calendar, BookOpen,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';
import { supabase } from '../lib/supabase/client';
import CreateMenuModal from './CreateMenuModal';

const AUTH_PATHS = ['/login', '/signup', '/onboarding', '/terms', '/privacy', '/offline'];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname.startsWith('/admin');

  const [sparks, setSparks] = useState(
    user?.wallet ? (user.wallet.purchased || 0) + (user.wallet.bonus || 0) + (user.wallet.creator || 0) : 0
  );

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

  // ── Wallet real-time listener via Supabase Realtime ─────────────────────────
  useEffect(() => {
    if (!user?.id || !supabase) return;

    // Fetch initial wallet balance
    supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data: w }) => {
        if (w) setSparks((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
      });

    const channel = supabase
      .channel(`sidebar-wallet-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const w = payload.new;
          if (w) {
            setSparks((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
          }
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
    { href: '/discover',      label: 'Discover',      Icon: Search },
    { href: '/messages',      label: 'Messages',      Icon: MessageSquare },
    { href: '/bookings',      label: 'My Bookings',   Icon: Calendar, badge: pendingBookingsCount },
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
    { href: '/bookings', label: 'Bookings', Icon: Calendar, badge: pendingBookingsCount },
    { href: '/profile',  label: 'Profile',  Icon: User },
  ];

  const avatarSrc = getUserAvatarUrl(user);

  if (AUTH_PATHS.includes(pathname)) return null;

  return (
    <>
      {/* ── Mobile top header ────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-[58px] flex items-center justify-between px-4 bg-white/90 backdrop-blur-xl border-b border-zinc-100 shadow-2xs">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="Meova" className="h-9 w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {!isAdminRoute && (
                <Link 
                  href="/wallet" 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-orange-50 text-[#F05A00] border border-orange-100 hover:bg-orange-100 transition-all duration-200 active:scale-95 shadow-2xs"
                >
                  <Zap size={13} className="fill-[#F05A00] text-[#F05A00]" />
                  <span className="tabular-nums font-black">{sparks.toLocaleString()}</span>
                </Link>
              )}

              {/* Notifications */}
              <Link 
                href="/notifications" 
                className={`relative p-2 rounded-full transition-all ${
                  pathname === '/notifications' 
                    ? 'text-[#F05A00] bg-orange-50' 
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
                title="Notifications"
              >
                <Bell size={20} className={unreadCount > 0 ? 'text-[#F05A00] fill-orange-50' : ''} strokeWidth={2} />
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
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
                title="Messages"
              >
                <MessageSquare size={20} className={unreadMsgCount > 0 ? 'text-[#F05A00] fill-orange-50' : ''} strokeWidth={2} />
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
              className="px-4 py-1.5 rounded-full text-xs font-black text-white bg-[#F05A00] hover:bg-[#D94F00] active:scale-95 transition-all shadow-2xs"
            >
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* ── Desktop sidebar ──────────────────── */}
      <aside 
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-300 select-none bg-white border-r border-zinc-100"
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-[#F05A00] hover:bg-orange-50 transition-colors cursor-pointer"
              >
                <PanelLeftOpen size={18} strokeWidth={2} />
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer flex-shrink-0"
              >
                <PanelLeftClose size={18} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {NAV.map(({ href, label, Icon, badge }) => {
            if (href === '/profile' && !user) return null;
            const active = isActive(href);
            const isNotif = label === 'Notifications';
            const hasUnread = isNotif && unreadCount > 0;
            const isMessages = label === 'Messages';
            const hasUnreadMsgs = isMessages && unreadMsgCount > 0;
            const hasBadge = badge && badge > 0;

            if (isCollapsed) {
              return (
                <Link 
                  key={href} 
                  href={href}
                  title={label}
                  className={`relative flex items-center justify-center w-12 h-11 mx-auto rounded-xl transition-all ${
                    active 
                      ? 'bg-orange-50 text-[#F05A00] border border-orange-100' 
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  active 
                    ? 'bg-orange-50 text-[#F05A00] border border-orange-100 font-black' 
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} className={`flex-shrink-0 ${active ? 'text-[#F05A00]' : ''}`} />
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
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 12 }}>
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
                  <p className="text-xs font-black truncate text-zinc-900 group-hover:text-[#F05A00] transition-colors">
                    {user.full_name || (user.email || 'user').split('@')[0]}
                  </p>
                  <p className="text-[10px] truncate text-zinc-400 font-semibold">
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
              <LogIn size={15} /> {!isCollapsed && <span>Log in</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ───────────── */}
      {!(AUTH_PATHS.includes(pathname) || (pathname?.startsWith('/messages/') && pathname !== '/messages') || pathname?.startsWith('/admin') || isKeyboardOpen) && (
        <nav 
          suppressHydrationWarning
          className="md:hidden hide-on-keyboard fixed bottom-0 inset-x-0 z-50 flex items-center justify-around bg-white/95 backdrop-blur-xl border-t border-zinc-200/60 shadow-[0_-4px_25px_rgba(0,0,0,0.05)]"
          style={{
            height: 'calc(62px + env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
        {MOBILE_NAV.map(({ href, label, Icon, isCenter }) => {
          if ((href === '/profile') && !user) {
            return (
              <Link key={href} href="/login" className="flex-1 flex flex-col items-center justify-center h-full text-zinc-400 hover:text-[#F05A00] transition-colors">
                <LogIn size={20} strokeWidth={2} />
                <span className="text-[10px] font-black mt-0.5">Login</span>
              </Link>
            );
          }
          const active = isActive(href);

          if (isCenter) {
            return (
              <button 
                key={href} 
                onClick={(e) => { e.preventDefault(); setShowCreateModal(true); }}
                className="flex-1 flex flex-col items-center justify-center relative -top-3.5 h-full select-none outline-none"
                style={{ zIndex: 60 }}
              >
                <div 
                  suppressHydrationWarning
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-[0_8px_22px_rgba(240,90,0,0.5)] hover:shadow-[0_12px_28px_rgba(240,90,0,0.6)] active:scale-90 transition-all ring-[3.5px] ring-white"
                  style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #D94F00 100%)' }}
                >
                  <Plus size={24} strokeWidth={3} />
                </div>
              </button>
            );
          }

          return (
            <Link 
              key={href} 
              href={href}
              className={`flex-1 flex flex-col items-center justify-center h-full relative select-none transition-all ${
                active ? 'text-[#F05A00]' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-orange-50/80 text-[#F05A00]' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-extrabold -mt-0.5 tracking-tight ${active ? 'text-[#F05A00]' : 'text-zinc-400'}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-[#F05A00]" />
              )}
            </Link>
          );
        })}
      </nav>
      )}
      
      <CreateMenuModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
