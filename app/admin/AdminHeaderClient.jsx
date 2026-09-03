'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, ArrowUpRight, Users, Radio, Sparkles, ShieldCheck, ArrowLeft } from '@/lib/icons';

const ADMIN_TABS = [
  { href: '/admin',             label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/admin/payments',    label: 'Payments',    Icon: CreditCard },
  { href: '/admin/withdrawals', label: 'Withdrawals', Icon: ArrowUpRight },
  { href: '/admin/campaigns',   label: 'Stories',     Icon: Sparkles },
  { href: '/admin/communities', label: 'Circles',     Icon: Radio },
  { href: '/admin/users',       label: 'Users',       Icon: Users },
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
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-black/[0.05]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/60 text-[#F05A00] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-black tracking-tight">Admin Console</span>
              <span className="text-[9px] font-black uppercase tracking-wider bg-orange-100 text-[#F05A00] px-1.5 py-0.2 rounded-md">
                Master HQ
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          onMouseDown={(e) => { try { e.currentTarget.blur(); } catch {} }}
          className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-black/70 hover:text-[#F05A00] transition-colors whitespace-nowrap flex-shrink-0 outline-none focus:outline-none"
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
                  ? 'bg-[#F05A00] text-white shadow-xs font-black'
                  : 'bg-white text-black/75 hover:text-black hover:bg-orange-50/50 border border-black/[0.08] font-bold shadow-2xs'
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
