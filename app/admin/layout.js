import { requireAdmin } from '../../lib/getAdminUser';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Wallet, ArrowUpRight, CreditCard, ShieldCheck } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin',              label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/admin/payments',     label: 'Payments',    Icon: CreditCard },
  { href: '/admin/withdrawals',  label: 'Withdrawals', Icon: ArrowUpRight },
  { href: '/admin/users',        label: 'Users',       Icon: Users },
];

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Admin header banner */}
      <div className="glass flex items-center justify-between"
        style={{ borderRadius: 14, padding: '10px 16px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Admin Dashboard</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>— {admin.email}</span>
        </div>
        <Link href="/" style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Back to app</Link>
      </div>

      <div className="flex gap-6 items-start">
        {/* Admin sidebar */}
        <nav className="flex-shrink-0 hidden sm:flex flex-col gap-1" style={{ width: 180 }}>
          {ADMIN_NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
