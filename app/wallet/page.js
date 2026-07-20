'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, ArrowDownLeft, ArrowUpRight, Gift, Clock,
  CheckCircle, XCircle, CreditCard, Trophy, TrendingUp, Lock, RefreshCw
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';

function fmt(n) { return (n || 0).toLocaleString('en-IN'); }
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TX_ICONS = {
  purchase:         <ArrowDownLeft size={14} />,
  bonus:            <Gift size={14} />,
  withdrawal:       <ArrowUpRight size={14} />,
  refund:           <ArrowDownLeft size={14} />,
  event_booking:    <Zap size={14} />,
  creator_earnings: <Trophy size={14} />,
  gig:              <TrendingUp size={14} />,
};

const TX_COLORS = {
  purchase:         'text-emerald-400',
  bonus:            'text-violet-400',
  creator_earnings: 'text-amber-400',
  refund:           'text-blue-400',
  withdrawal:       'text-rose-400',
  event_booking:    'text-[var(--text-secondary)]',
};

const WD_STATUS = {
  pending:  { Icon: Clock,       label: 'Pending',  color: 'text-amber-400' },
  paid:     { Icon: CheckCircle, label: 'Paid',     color: 'text-emerald-400' },
  rejected: { Icon: XCircle,     label: 'Rejected', color: 'text-rose-400' },
};

const PR_STATUS = {
  pending:  { label: 'Awaiting Verification', color: 'text-amber-400' },
  approved: { label: 'Approved',              color: 'text-emerald-400' },
  rejected: { label: 'Rejected',              color: 'text-rose-400' },
};

export default function WalletPage() {
  const [wallet, setWallet]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [payRequests, setPayRequests] = useState([]);
  const [escrow, setEscrow]           = useState(0);
  const [userId, setUserId]           = useState(null);
  const [loading, setLoading]         = useState(true);

  const loadData = (uid) => {
    const w   = mockDb.getWallet(uid);
    const txs = mockDb.getTransactions(uid);
    const wds = mockDb.getWithdrawals(uid);
    const prs = mockDb.getPaymentRequestsByUser(uid);
    const esc = mockDb.getEscrowAmount(uid);
    setWallet(w);
    setTransactions(txs.slice(0, 25));
    setWithdrawals(wds);
    setPayRequests(prs);
    setEscrow(esc);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function init() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        const uid = data?.user?.id || data?.user?.uid;
        if (!uid) { setLoading(false); return; }
        setUserId(uid);
        loadData(uid);
      } catch (e) {
        console.warn('Session fetch failed:', e);
      } finally {
        setLoading(false);
      }
    }

    init();

    // Refresh when wallet-updated event fires (from other tabs/components)
    const onUpdate = () => { if (userId) loadData(userId); };
    window.addEventListener('profile-updated', onUpdate);
    window.addEventListener('wallet-updated', onUpdate);
    return () => {
      window.removeEventListener('profile-updated', onUpdate);
      window.removeEventListener('wallet-updated', onUpdate);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div>
          <p className="text-sm font-bold text-[var(--text-secondary)]">Please log in to view your wallet.</p>
          <Link href="/login" className="btn btn-primary mt-4 inline-block px-6 py-2.5 text-xs">Log In</Link>
        </div>
      </div>
    );
  }

  const totalSparks  = (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0);
  const pendingPays  = payRequests.filter(r => r.status === 'pending');
  const hasPendingWd = withdrawals.some(w => w.status === 'pending');

  return (
    <div className="max-w-[680px] mx-auto pb-28 px-4 space-y-6 anim-fade-in">

      {/* ── HERO BALANCE ─────────────────────────────────── */}
      <div className="rounded-[28px] border border-[var(--border-mid)] bg-[var(--bg-elevated)] p-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 10%, var(--accent-glow) 0%, transparent 65%)' }} />

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)] mb-3">
            Available Balance
          </p>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-black tracking-tight text-[var(--text-primary)]">{fmt(totalSparks)}</span>
            <span className="text-3xl">⚡</span>
            <span className="text-sm font-bold text-[var(--text-muted)]">Sparks</span>
          </div>

          {/* Escrow lock indicator */}
          {escrow > 0 && (
            <div className="flex items-center gap-1.5 mb-5 text-[10px] font-bold text-amber-400">
              <Lock size={11} />
              <span>{fmt(escrow)} Sparks locked in active bookings (escrow)</span>
            </div>
          )}
          {escrow === 0 && <div className="mb-5" />}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/wallet/buy"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white font-bold text-sm hover:bg-[var(--accent-hover)] transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" /> Buy Sparks
            </Link>

            {(wallet.creator || 0) >= 1000 && !hasPendingWd ? (
              <Link
                href="/wallet/withdraw"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-mid)] bg-[var(--bg-surface)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--bg-hover)] transition-all active:scale-95"
              >
                <ArrowUpRight size={16} /> Withdraw
              </Link>
            ) : hasPendingWd ? (
              <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-amber-500 font-bold text-sm opacity-75 cursor-not-allowed">
                <Clock size={16} /> Withdrawal Pending
              </button>
            ) : (
              <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-bold text-sm opacity-50 cursor-not-allowed">
                <ArrowUpRight size={16} /> Withdraw (min 1,000 Creator ⚡)
              </button>
            )}

            <button
              onClick={() => { if (userId) loadData(userId); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-bold text-sm hover:bg-[var(--bg-hover)] transition-all active:scale-95"
              title="Refresh balance"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── ASSET BREAKDOWN ──────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">Asset Breakdown</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'purchased', label: 'Purchased',       Icon: CreditCard, color: 'text-blue-400',   borderColor: 'rgba(100,130,200,0.18)',  badge: 'Spend' },
            { key: 'bonus',     label: 'Bonus',           Icon: Gift,       color: 'text-violet-400', borderColor: 'rgba(140,100,200,0.18)',  badge: 'Spend' },
            { key: 'creator',   label: 'Creator Earnings',Icon: Trophy,     color: 'text-amber-400',  borderColor: 'rgba(80,160,130,0.18)',   badge: 'Withdraw' },
          ].map(t => (
            <div key={t.key} className="rounded-2xl border bg-[var(--bg-elevated)] p-4 space-y-3" style={{ borderColor: t.borderColor }}>
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <t.Icon size={16} className={t.color} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--bg-active)] text-[var(--accent)] border border-[var(--accent-dim)]">
                  {t.badge}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] leading-tight mb-1">{t.label}</p>
                <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{fmt(wallet[t.key])}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LIFETIME STATS ───────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">Activity Summary</p>
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

      {/* ── PENDING PAYMENT REQUESTS ─────────────────────── */}
      {pendingPays.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
            Pending Spark Purchases
          </p>
          <div className="space-y-2">
            {pendingPays.map(pr => (
              <div key={pr.id} className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div>
                  <p className="text-xs font-black text-[var(--text-primary)]">{pr.pack_name} Pack — {fmt(pr.sparks)} ⚡</p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] mt-0.5">
                    Ref: <span className="font-mono text-amber-400">{pr.reference_code}</span> · ₹{pr.amount_inr}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-amber-400">
                  <Clock size={11} /> Awaiting Verification
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRANSACTION HISTORY ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">Transaction History</p>
          <span className="text-[10px] font-bold text-[var(--text-muted)]">Last {transactions.length}</span>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center">
            <p className="text-sm font-bold text-[var(--text-muted)]">No transactions yet. Buy your first Sparks to start!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 hover:bg-[var(--bg-hover)] transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 ${TX_COLORS[tx.type] || 'text-[var(--text-secondary)]'}`}>
                      {TX_ICONS[tx.type] || <Zap size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[var(--text-primary)] truncate capitalize">
                        {tx.type.replace(/_/g, ' ')}
                        {tx.metadata?.pack_name ? ` — ${tx.metadata.pack_name} Pack` : ''}
                        {tx.metadata?.reason ? ` — ${tx.metadata.reason.slice(0, 40)}` : ''}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">{fmtDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black flex-shrink-0 ${isPositive ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
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
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">Withdrawal Requests</p>
          <div className="space-y-2">
            {withdrawals.map(wd => {
              const st = WD_STATUS[wd.status] || WD_STATUS.pending;
              return (
                <div key={wd.id} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
                  <div>
                    <p className="text-xs font-black text-[var(--text-primary)]">{fmt(wd.amount)} ⚡ via {wd.method?.toUpperCase()}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">{fmtDate(wd.requested_at)}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-1.5 ${st.color}`}>
                    <st.Icon size={11} /> {st.label}
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
