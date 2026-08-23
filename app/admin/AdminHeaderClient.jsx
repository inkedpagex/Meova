'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, ArrowUpRight, Users } from 'lucide-react';

const ADMIN_TABS = [
  { href: '/admin',             label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/admin/payments',    label: 'Payments',    Icon: CreditCard },
  { href: '/admin/withdrawals', label: 'Withdrawals', Icon: ArrowUpRight },
  { href: '/admin/users',       label: 'Users',       Icon: Users },
];

export default function AdminHeaderClient() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">

      {/* Navigation Tabs - Icon-only on mobile to fit 100% on screen, Icon + Text on desktop */}
      <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl w-full min-w-0">
        {ADMIN_TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3.5 rounded-lg transition-all ${
                active
                  ? 'bg-white text-[#8C3573] shadow-xs border border-[#f5ebf4] font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
              <span className="hidden sm:inline text-[11px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
