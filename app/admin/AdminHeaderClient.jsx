'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, LayoutDashboard, CreditCard, ArrowUpRight, Users } from 'lucide-react';

const ADMIN_TABS = [
  { href: '/admin',             label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/admin/payments',    label: 'Payments',    Icon: CreditCard },
  { href: '/admin/withdrawals', label: 'Withdrawals', Icon: ArrowUpRight },
  { href: '/admin/users',       label: 'Users',       Icon: Users },
];

export default function AdminHeaderClient({ admin }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) setUnreadCount(data.unreadCount || 0);
      } catch {
        /* silent */
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      document.cookie = '__meetify_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {/* Admin Top Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
        {ADMIN_TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                active
                  ? 'bg-white text-[#7c3aed] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Notifications & Logout */}
      <div className="flex items-center gap-2">
        <Link href="/notifications" className="relative p-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-center">
          <Bell size={16} className={unreadCount > 0 ? 'text-[#7c3aed]' : 'text-slate-600'} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#7c3aed] text-white text-[9px] font-black flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <button
          onClick={handleLogout}
          className="text-xs font-extrabold px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <LogOut size={13} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
