'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, ArrowUpRight, Users, ShieldCheck,
  FileText, Settings, Bell, LogOut, ChevronDown, Menu, X, MoreHorizontal
} from 'lucide-react';
import { getUserAvatarUrl } from '../utils/avatar';

function MeetuplyLogo({ size = 28 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: 'linear-gradient(135deg, #8C3573 0%, #b5609d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(140,53,115,0.3)',
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const ADMIN_NAV = [
  { href: '/admin',             label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/admin/payments',    label: 'Payments',     Icon: CreditCard },
  { href: '/admin/withdrawals', label: 'Withdrawals',  Icon: ArrowUpRight },
  { href: '/admin/users',       label: 'Users',        Icon: Users },
  { href: '/admin?tab=verifs',  label: 'Verifications',Icon: ShieldCheck },
  { href: '/admin?tab=reports', label: 'Reports',      Icon: FileText },
  { href: '/admin?tab=settings',label: 'Settings',     Icon: Settings },
];

const MOBILE_BOTTOM_NAV = [
  { href: '/admin',             label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/admin/payments',    label: 'Payments',    Icon: CreditCard },
  { href: '/admin/withdrawals', label: 'Withdrawals', Icon: ArrowUpRight },
  { href: '/admin/users',       label: 'Users',       Icon: Users },
  { href: '/admin?tab=more',    label: 'More',        Icon: MoreHorizontal },
];

export default function AdminShell({ admin, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href) && href !== '/admin';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      document.cookie = '__meetuply_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const avatarSrc = getUserAvatarUrl(admin);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* ── DESKTOP SIDEBAR (left fixed) ─────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-200 z-30 p-5 justify-between">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <MeetuplyLogo size={32} />
            <span className="font-black text-xl tracking-tight text-slate-900">meetuply</span>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1">
            {ADMIN_NAV.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    active
                      ? 'bg-[#fcf6fa] text-[#8C3573]'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden relative border border-slate-200 flex-shrink-0">
              <Image src={avatarSrc} alt="admin" fill sizes="36px" style={{ objectFit: 'cover' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-black text-slate-900 truncate">
                {admin?.full_name || 'Chirag Admin'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 truncate">
                {admin?.role === 'admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
          <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
        </div>
      </aside>

      {/* ── MOBILE HEADER (top fixed) ────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-700"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="font-extrabold text-sm text-slate-900">Admin Dashboard</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative p-2 rounded-full border border-slate-200 bg-slate-50">
            <Bell size={16} className="text-slate-600" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#8C3573] text-white text-[9px] font-black flex items-center justify-center">
              3
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm pt-16 px-4">
          <div className="bg-white rounded-2xl p-4 shadow-xl space-y-2 border border-slate-100">
            {ADMIN_NAV.map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#fcf6fa] hover:text-[#8C3573]"
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ────────────────────────────────────── */}
      <div className="md:pl-60 min-h-screen flex flex-col">
        {/* Top Header Bar (Desktop) */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
              <ShieldCheck size={14} />
              <span>Admin Dashboard</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{admin?.email}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative p-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all">
              <Bell size={16} className="text-slate-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8C3573] text-white text-[9px] font-black flex items-center justify-center">
                3
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV BAR (fixed bottom) ────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 h-16 flex items-center justify-around px-2 shadow-lg">
        {MOBILE_BOTTOM_NAV.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
                active ? 'text-[#8C3573]' : 'text-slate-400'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold mt-1">{label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
