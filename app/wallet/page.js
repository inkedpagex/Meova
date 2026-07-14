import { requireAuth } from '../../lib/getAdminUser';
import { getOrCreateWallet, getTransactions, getWithdrawals } from '../../lib/wallet';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Zap, ArrowDownLeft, ArrowUpRight, Gift, TrendingUp, Clock, CheckCircle, XCircle, CreditCard, Sparkles, Trophy } from 'lucide-react';

export const metadata = { title: 'Wallet — meetuply' };

const SPARK_TYPES = [
  {
    key:       'purchased',
    label:     'Purchased Sparks',
    sublabel:  'Bought with real money',
    icon:      <CreditCard className="w-5 h-5 text-blue-400" />,
    canSpend:  true,
    canWithdraw: false,
    bgGlow:    'rgba(59,130,246,0.03)',
    borderColor: 'rgba(59,130,246,0.15)',
    hoverBorderColor: 'rgba(59,130,246,0.4)',
    accentColor: '#3b82f6',
  },
  {
    key:       'bonus',
    label:     'Bonus Sparks',
    sublabel:  'Earned via rewards & referrals',
    icon:      <Gift className="w-5 h-5 text-purple-400" />,
    canSpend:  true,
    canWithdraw: false,
    bgGlow:    'rgba(168,85,247,0.03)',
    borderColor: 'rgba(168,85,247,0.15)',
    hoverBorderColor: 'rgba(168,85,247,0.4)',
    accentColor: '#a855f7',
  },
  {
    key:       'creator',
    label:     'Creator Earnings',
    sublabel:  'Earned by hosting & creating',
    icon:      <Trophy className="w-5 h-5 text-emerald-400" />,
    canSpend:  true,
    canWithdraw: true,
    bgGlow:    'rgba(16,185,129,0.03)',
    borderColor: 'rgba(16,185,129,0.15)',
    hoverBorderColor: 'rgba(16,185,129,0.4)',
    accentColor: '#10b981',
  },
];

function fmt(n) { return (n || 0).toLocaleString('en-IN'); }
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TX_ICONS = {
  purchase:   <ArrowDownLeft size={14} className="text-blue-400" />,
  bonus:      <Gift size={14} className="text-purple-400" />,
  withdrawal: <ArrowUpRight size={14} className="text-rose-400" />,
  refund:     <ArrowDownLeft size={14} className="text-emerald-400" />,
  event:      <Zap size={14} className="text-yellow-400" />,
  coffee:     <Zap size={14} className="text-amber-400" />,
  gig:        <TrendingUp size={14} className="text-cyan-400" />,
};

const WD_STATUS = {
  pending:  { icon: <Clock size={12} />,        color: '#fb923c', label: 'Pending' },
  approved: { icon: <CheckCircle size={12} />,  color: '#34d399', label: 'Approved' },
  rejected: { icon: <XCircle size={12} />,      color: '#f87171', label: 'Rejected' },
  paid:     { icon: <CheckCircle size={12} />,  color: '#34d399', label: 'Paid' },
};

export default async function WalletPage() {
  const user = await requireAuth();
  if (!user) redirect('/login');

  const [wallet, transactions, withdrawals] = await Promise.all([
    getOrCreateWallet(user.uid, user.email),
    getTransactions(user.uid, 20),
    getWithdrawals(user.uid),
  ]);

  const totalSparks = (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0);

  return (
    <div className="max-w-[760px] mx-auto anim-fade-in relative px-4 pb-12">
      {/* Ambient background glows */}
      <div className="absolute top-[-100px] left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[200px] right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 md:p-10 mb-8 shadow-2xl">
        {/* Subtle decorative vector element */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-[var(--bg-surface)] opacity-5 rounded-full pointer-events-none" />
        <div className="absolute right-8 top-8 w-1.5 h-1.5 bg-yellow-400 rounded-full anim-pulse-soft" />

        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-[0.15em] uppercase block mb-3">
          Available Balance
        </span>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
            {fmt(totalSparks)}
            <span className="text-yellow-400 text-3xl md:text-4xl">⚡</span>
          </span>
          <span className="text-xs font-bold text-[var(--text-muted)]">Sparks</span>
        </div>

        {/* Action Buttons within Hero */}
        <div className="flex flex-wrap gap-3.5">
          <Link href="/wallet/buy" className="group flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] font-bold text-xs transition-all shadow-lg active:scale-95">
            <Zap className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
            <span>Buy Sparks</span>
          </Link>
          {(wallet.creator || 0) >= 1000 ? (
            <Link href="/wallet/withdraw" className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] font-bold text-xs transition-all active:scale-95 shadow-sm">
              <ArrowUpRight className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Withdraw Earnings</span>
            </Link>
          ) : (
            <button disabled className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-bold text-xs cursor-not-allowed opacity-50 shadow-sm">
              <ArrowUpRight className="w-4 h-4 opacity-50" />
              <span>Withdraw (min 1,000 ES)</span>
            </button>
          )}
        </div>
      </div>

      {/* Segment Header */}
      <div className="mb-4">
        <h2 className="text-xs font-black text-[var(--text-muted)] tracking-[0.12em] uppercase">
          Asset Breakdown
        </h2>
      </div>

      {/* Three Premium Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {SPARK_TYPES.map(t => {
          const balance = wallet[t.key] || 0;
          return (
            <div 
              key={t.key} 
              className="group relative overflow-hidden rounded-2xl border bg-[var(--bg-elevated)] p-5 transition-all duration-300 hover:-translate-y-1 shadow-sm"
              style={{ 
                borderColor: t.borderColor,
                backgroundImage: `radial-gradient(circle at 100% 0%, ${t.bgGlow} 0%, transparent 70%)`
              }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  {t.icon}
                </div>
                {/* Spend/Withdraw indicators */}
                <div className="flex gap-1.5">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                    Spend
                  </span>
                  {t.canWithdraw && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                      Out
                  </span>
                  )}
                </div>
              </div>

              {/* Title & Value */}
              <h3 className="text-xs font-black text-[var(--text-secondary)] tracking-tight mb-1">
                {t.label}
              </h3>
              <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-2">
                {fmt(balance)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold leading-normal">
                {t.sublabel}
              </p>

              {/* Subtle hover background highlight */}
              <div className="absolute inset-0 bg-[var(--bg-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Lifetime Stats */}
      <div className="mb-8">
        <h2 className="text-xs font-black text-[var(--text-muted)] tracking-[0.12em] uppercase mb-4">
          Activity Summary
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Lifetime Purchased', value: fmt(wallet.lifetime_purchased), color: '#3b82f6' },
            { label: 'Lifetime Earned', value: fmt(wallet.lifetime_earned), color: '#a855f7' },
            { label: 'Lifetime Withdrawn', value: fmt(wallet.lifetime_withdrawn), color: '#10b981' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-center shadow-sm">
              <p className="text-lg font-black text-[var(--text-primary)]" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[9px] text-[var(--text-muted)] mt-1 font-bold uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black text-[var(--text-muted)] tracking-[0.12em] uppercase">
            Transaction History
          </h2>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Showing last {transactions.length}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center text-[var(--text-muted)] text-xs font-bold shadow-sm">
            No transactions yet. Buy your first Sparks to start!
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isPositive = tx.amount > 0;
              return (
                <div 
                  key={tx.id} 
                  className="group flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 hover:bg-[var(--bg-hover)] transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      {TX_ICONS[tx.type] || <Zap size={14} className="text-yellow-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[var(--text-primary)] truncate capitalize">
                        {tx.type.replace('_', ' ')}
                        {tx.metadata?.pack_name ? ` — ${tx.metadata.pack_name} Pack` : ''}
                        {tx.metadata?.reason ? ` — ${tx.metadata.reason}` : ''}
                      </p>
                      <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">
                        {fmtDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black flex-shrink-0 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? '+' : ''}{fmt(tx.amount)} ⚡
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div>
          <h2 className="text-xs font-black text-[var(--text-muted)] tracking-[0.12em] uppercase mb-4">
            Withdrawal Requests
          </h2>
          <div className="space-y-2">
            {withdrawals.map(wd => {
              const st = WD_STATUS[wd.status] || WD_STATUS.pending;
              return (
                <div 
                  key={wd.id} 
                  className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 shadow-sm"
                >
                  <div>
                    <p className="text-xs font-black text-[var(--text-primary)]">
                      {fmt(wd.amount)} ⚡ via {wd.method?.toUpperCase()}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">
                      {fmtDate(wd.requested_at)}
                    </p>
                  </div>
                  <span 
                    className="text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1.5"
                    style={{ 
                      color: st.color, 
                      backgroundColor: `${st.color}10`,
                      border: `1px solid ${st.color}20`
                    }}
                  >
                    {st.icon}
                    <span>{st.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
