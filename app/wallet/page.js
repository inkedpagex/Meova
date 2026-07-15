import { requireAuth } from '../../lib/getAdminUser';
import { getOrCreateWallet, getTransactions, getWithdrawals } from '../../lib/wallet';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, ArrowDownLeft, ArrowUpRight, Gift, Clock,
  CheckCircle, XCircle, CreditCard, Trophy, TrendingUp
} from 'lucide-react';

export const metadata = { title: 'Wallet — meetifyy' };

const SPARK_TYPES = [
  {
    key: 'purchased', label: 'Purchased Sparks', sublabel: 'Bought with real money',
    Icon: CreditCard,
    iconColor: 'var(--tw-blue)',
    borderVar: 'rgba(100,130,200,0.18)',
  },
  {
    key: 'bonus', label: 'Bonus Sparks', sublabel: 'Earned via rewards & referrals',
    Icon: Gift,
    iconColor: 'var(--tw-violet)',
    borderVar: 'rgba(140,100,200,0.18)',
  },
  {
    key: 'creator', label: 'Creator Earnings', sublabel: 'Earned by hosting & creating',
    Icon: Trophy,
    iconColor: 'var(--tw-emerald)',
    borderVar: 'rgba(80,160,130,0.18)',
    canWithdraw: true,
  },
];

function fmt(n) { return (n || 0).toLocaleString('en-IN'); }
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TX_ICONS = {
  purchase:   <ArrowDownLeft size={14} />,
  bonus:      <Gift size={14} />,
  withdrawal: <ArrowUpRight size={14} />,
  refund:     <ArrowDownLeft size={14} />,
  event:      <Zap size={14} />,
  coffee:     <Zap size={14} />,
  gig:        <TrendingUp size={14} />,
};

const WD_STATUS = {
  pending:  { Icon: Clock,       label: 'Pending' },
  approved: { Icon: CheckCircle, label: 'Approved' },
  rejected: { Icon: XCircle,     label: 'Rejected' },
  paid:     { Icon: CheckCircle, label: 'Paid' },
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
    <div className="max-w-[680px] mx-auto pb-28 px-4 space-y-6 anim-fade-in">

      {/* ── HERO BALANCE ─────────────────────────────────── */}
      <div className="rounded-[28px] border border-[var(--border-mid)] bg-[var(--bg-elevated)] p-7 relative overflow-hidden">
        {/* Subtle ambient gradient */}
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 10%, var(--accent-glow) 0%, transparent 65%)' }} />

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)] mb-3">
            Available Balance
          </p>

          <div className="flex items-baseline gap-3 mb-7">
            <span className="text-5xl font-black tracking-tight text-[var(--text-primary)]">
              {fmt(totalSparks)}
            </span>
            <span className="text-3xl">⚡</span>
            <span className="text-sm font-bold text-[var(--text-muted)]">Sparks</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/wallet/buy"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white font-bold text-sm hover:bg-[var(--accent-hover)] transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              Buy Sparks
            </Link>
            {(wallet.creator || 0) >= 1000 ? (
              <Link
                href="/wallet/withdraw"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-mid)] bg-[var(--bg-surface)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--bg-hover)] transition-all active:scale-95"
              >
                <ArrowUpRight size={16} />
                Withdraw
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-bold text-sm opacity-50 cursor-not-allowed"
              >
                <ArrowUpRight size={16} />
                Withdraw (min 1,000)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ASSET BREAKDOWN ──────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
          Asset Breakdown
        </p>
        <div className="grid grid-cols-3 gap-3">
          {SPARK_TYPES.map(t => {
            const balance = wallet[t.key] || 0;
            return (
              <div
                key={t.key}
                className="rounded-2xl border bg-[var(--bg-elevated)] p-4 space-y-3"
                style={{ borderColor: t.borderVar }}
              >
                {/* Icon + badges */}
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <t.Icon size={16} className="text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--bg-active)] text-[var(--accent)] border border-[var(--accent-dim)]">
                      Spend
                    </span>
                    {t.canWithdraw && (
                      <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        Out
                      </span>
                    )}
                  </div>
                </div>

                {/* Label + Value */}
                <div>
                  <p className="text-[10px] font-black text-[var(--text-secondary)] leading-tight mb-1">{t.label}</p>
                  <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{fmt(balance)}</p>
                  <p className="text-[9px] text-[var(--text-muted)] font-semibold mt-1 leading-snug">{t.sublabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVITY SUMMARY ─────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
          Activity Summary
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Lifetime Purchased', value: fmt(wallet.lifetime_purchased) },
            { label: 'Lifetime Earned',    value: fmt(wallet.lifetime_earned) },
            { label: 'Lifetime Withdrawn', value: fmt(wallet.lifetime_withdrawn) },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-center">
              <p className="text-xl font-black text-[var(--text-primary)] mb-1">{s.value}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)] leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRANSACTION HISTORY ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Transaction History
          </p>
          <span className="text-[10px] font-bold text-[var(--text-muted)]">
            Last {transactions.length}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center">
            <p className="text-sm font-bold text-[var(--text-muted)]">
              No transactions yet. Buy your first Sparks to start!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 hover:bg-[var(--bg-hover)] transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]">
                      {TX_ICONS[tx.type] || <Zap size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[var(--text-primary)] truncate capitalize">
                        {tx.type.replace('_', ' ')}
                        {tx.metadata?.pack_name ? ` — ${tx.metadata.pack_name} Pack` : ''}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
                        {fmtDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black flex-shrink-0 ${isPositive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {isPositive ? '+' : ''}{fmt(tx.amount)} ⚡
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── WITHDRAWAL HISTORY ───────────────────────────── */}
      {withdrawals.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
            Withdrawal Requests
          </p>
          <div className="space-y-2">
            {withdrawals.map(wd => {
              const st = WD_STATUS[wd.status] || WD_STATUS.pending;
              return (
                <div key={wd.id} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
                  <div>
                    <p className="text-xs font-black text-[var(--text-primary)]">
                      {fmt(wd.amount)} ⚡ via {wd.method?.toUpperCase()}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
                      {fmtDate(wd.requested_at)}
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <st.Icon size={11} />
                    {st.label}
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
