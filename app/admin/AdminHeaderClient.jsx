'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, ArrowUpRight, Users, Radio, Sparkles, ShieldCheck, ArrowLeft } from '@/lib/icons';

const ADMIN_TABS = [
  { href: '/admin',               label: 'Dashboard',     Icon: LayoutDashboard },
  { href: '/admin/verifications', label: 'Verifications', Icon: ShieldCheck },
  { href: '/admin/payments',      label: 'Payments',      Icon: CreditCard },
  { href: '/admin/withdrawals',   label: 'Withdrawals',   Icon: ArrowUpRight },
  { href: '/admin/campaigns',     label: 'Stories',       Icon: Sparkles },
  { href: '/admin/communities',   label: 'Circles',       Icon: Radio },
  { href: '/admin/users',         label: 'Users',         Icon: Users },
];

export default function AdminHeaderClient() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      {/* Top Header Row with Back to Feed Link */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#E7E5E4]/[0.05]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)]/60 text-[var(--accent)] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#1C1917] tracking-tight">Admin Console</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-tint-10)] text-[var(--accent)] px-1.5 py-0.2 rounded-md">
                Master HQ
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          onMouseDown={(e) => { try { e.currentTarget.blur(); } catch {} }}
          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#1C1917]/70 hover:text-[var(--accent)] transition-colors whitespace-nowrap flex-shrink-0 outline-none focus:outline-none"
        >
          <ArrowLeft size={12} strokeWidth={2.5} />
          <span>Exit to Campus</span>
        </Link>
      </div>

      {/* Navigation Tabs - Clean horizontal scrollable pills showing BOTH Icon & Label on all screen sizes */}
      <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full min-w-0">
        {ADMIN_TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              onMouseDown={(e) => { try { e.currentTarget.blur(); } catch {} }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs transition-all flex-shrink-0 whitespace-nowrap outline-none focus:outline-none active:scale-95 cursor-pointer ${
                active
                  ? 'bg-[var(--accent)] text-white shadow-xs font-bold'
                  : 'bg-white text-[#1C1917]/75 hover:text-[#1C1917] hover:bg-[var(--accent-tint-10)]/50 border border-[#E7E5E4]/[0.08] font-bold shadow-2xs'
              }`}
            >
              <Icon size={14} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
              <span className="uppercase tracking-wider text-[11px]">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
