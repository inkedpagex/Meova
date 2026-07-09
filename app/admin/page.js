import { requireAdmin } from '../../lib/getAdminUser';
import { getAdminStats } from '../../lib/wallet';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Zap, Users, CreditCard, ArrowUpRight, TrendingUp, ShieldCheck, Clock } from 'lucide-react';

export const metadata = { title: 'Admin — meetuply' };

function StatCard({ icon: Icon, label, value, color, href }) {
  const inner = (
    <div className="card flex flex-col gap-3 hover:border-white/10 transition-all"
      style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '20px 20px 18px', cursor: href ? 'pointer' : 'default' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  const STATS = [
    { icon: Users,       label: 'Total Users',              value: stats.totalUsers || 0,              color: '#60a5fa', href: '/admin/users' },
    { icon: Zap,         label: 'Sparks in Circulation',    value: stats.totalSparksInCirculation || 0, color: '#a78bfa' },
    { icon: TrendingUp,  label: 'Lifetime Purchased Sparks',value: stats.lifetimePurchasedSparks || 0, color: '#4ade80' },
    { icon: Clock,       label: 'Pending Payments',         value: stats.pendingPayments || 0,          color: '#fb923c', href: '/admin/payments' },
    { icon: ArrowUpRight,label: 'Pending Withdrawals',      value: stats.pendingWithdrawals || 0,       color: '#f87171', href: '/admin/withdrawals' },
    { icon: CreditCard,  label: 'Total Transactions',       value: stats.totalTransactions || 0,        color: '#22d3ee' },
  ];

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Overview</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Platform health at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" style={{ marginBottom: 32 }}>
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/payments" className="btn btn-outline flex items-center gap-2" style={{ fontSize: 12 }}>
            <CreditCard size={13} /> Verify Payments
            {stats.pendingPayments > 0 && (
              <span style={{ background: '#fb923c', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>
                {stats.pendingPayments}
              </span>
            )}
          </Link>
          <Link href="/admin/withdrawals" className="btn btn-outline flex items-center gap-2" style={{ fontSize: 12 }}>
            <ArrowUpRight size={13} /> Withdrawals
            {stats.pendingWithdrawals > 0 && (
              <span style={{ background: '#f87171', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>
                {stats.pendingWithdrawals}
              </span>
            )}
          </Link>
          <Link href="/admin/users" className="btn btn-ghost flex items-center gap-2" style={{ fontSize: 12 }}>
            <Users size={13} /> Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}
