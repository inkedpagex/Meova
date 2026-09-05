'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Zap, Clock, RefreshCw, Loader2, AlertCircle, ShieldCheck } from '@/lib/icons';

function fmt(n) { return (n || 0).toLocaleString('en-IN'); }
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLE = {
  paid_claimed: { color: 'text-amber-800',   bg: 'bg-amber-50',   border: 'border-amber-300',   label: 'Claimed (Review Needed)' },
  pending:      { color: 'text-blue-800',    bg: 'bg-blue-50',    border: 'border-blue-200',    label: 'Waiting for Payment' },
  approved:     { color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Approved' },
  rejected:     { color: 'text-rose-800',    bg: 'bg-rose-50',    border: 'border-rose-200',    label: 'Rejected' },
  expired:      { color: 'text-slate-700',   bg: 'bg-slate-100',  border: 'border-slate-300',   label: 'Expired' },
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('claimed'); // 'claimed' | 'pending' | 'all'
  const [loading, setLoading] = useState('');
  const [result, setResult] = useState(null);
  const [fetching, setFetching] = useState(true);

  // Reject modal state
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list-payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      const all = (data.payments || []).map(p => ({
        ...p,
        status: (p.status || 'pending').toLowerCase()
      }));
      setPayments([...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error('[AdminPaymentsPage] load error:', err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
    const interval = setInterval(loadPayments, 15000);
    return () => clearInterval(interval);
  }, [loadPayments]);

  async function handleApprove(id) {
    setLoading(id + '_approve');
    setResult(null);

    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, message: 'Payment approved — Sparks credited to user ledger!' });
      } else {
        setResult({ ok: false, message: data.error || 'Approval failed.' });
      }
      loadPayments();
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setLoading('');
    }
  }

  async function submitReject() {
    if (!rejectModalId) return;
    const id = rejectModalId;
    setLoading(id + '_reject');
    setResult(null);

    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', reason: rejectReason || 'Amount not found in bank statement' })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, message: 'Payment rejected — User notified.' });
        setRejectModalId(null);
        setRejectReason('');
      } else {
        setResult({ ok: false, message: data.error || 'Rejection failed.' });
      }
      loadPayments();
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setLoading('');
    }
  }

  const claimedCount = payments.filter(p => p.status === 'paid_claimed').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const shown = filter === 'claimed'
    ? payments.filter(p => p.status === 'paid_claimed')
    : filter === 'pending'
    ? payments.filter(p => p.status === 'pending')
    : payments;

  return (
    <div className="anim-fade-in space-y-6 max-w-5xl mx-auto px-2 sm:px-4 pb-20">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-[24px] border border-[#E7E5E4] shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
            <span>Decimal Payment Verification</span>
            <ShieldCheck size={20} className="text-emerald-600" />
          </h1>
          <p className="text-xs md:text-sm font-medium text-[#78716C] mt-1">
            Match exact decimal amounts against UPI bank statements and credit Sparks atomically.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] border border-[#E7E5E4] text-xs font-bold text-[#1C1917] transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <RefreshCw size={14} className={fetching ? 'animate-spin text-[var(--accent)]' : 'text-[#78716C]'} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-[#FAFAF8] rounded-2xl border border-[#E7E5E4] w-fit">
        {[
          { key: 'claimed', label: `Pending Claims (${claimedCount})` },
          { key: 'pending', label: `Active Reservations (${pendingCount})` },
          { key: 'all',     label: `All History (${payments.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              filter === t.key
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white font-semibold'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`p-4 rounded-2xl border text-xs md:text-sm font-bold flex items-center gap-2.5 ${
          result.ok
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {result.ok ? <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" /> : <XCircle size={16} className="text-rose-600 flex-shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      {/* Payments list */}
      {fetching ? (
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
          <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Fetching payment records...</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-12 text-center shadow-xs">
          <Zap size={28} className="text-[#A8A29E] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#1C1917]">
            {filter === 'claimed' ? 'No pending claims waiting for review' : 'No records found in this category'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {shown.map(p => {
            const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending;
            const isActing = loading.startsWith(p.id);
            const isClaimed = p.status === 'paid_claimed';
            const isPending = p.status === 'pending';
            const isExpired = p.status === 'expired';

            return (
              <div
                key={p.id}
                className={`bg-white border p-5 rounded-[22px] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-xs ${
                  isClaimed ? 'border-amber-300 ring-2 ring-amber-500/10' : 'border-[#E7E5E4]'
                }`}
              >
                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* User Identity & Tag */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-[var(--accent)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {(p.user_name || 'C')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1C1917] truncate">
                            {p.user_name || 'Classmate'}
                          </span>
                          {p.branch && (
                            <span className="text-[10px] font-bold text-[#78716C] bg-[#FAFAF8] border border-[#E7E5E4] px-2 py-0.5 rounded">
                              {p.branch} {p.year ? `Y${p.year}` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#78716C] font-semibold truncate">
                          {p.user_email || 'No email'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${st.color} ${st.bg} ${st.border} flex-shrink-0`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Pack & Exact Matching Decimal */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-bold text-[#1C1917]">
                      {p.sparks} Sparks ⚡
                    </span>
                    <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                      Exact UPI: ₹{Number(p.final_amount || p.amount_inr || p.sparks).toFixed(2)}
                    </span>
                    {p.unique_decimal && (
                      <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] px-2.5 py-1 rounded-xl font-mono">
                        Paise Key: .{p.unique_decimal}
                      </span>
                    )}
                    {p.reference_code && (
                      <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl font-mono font-bold">
                        Ref: {p.reference_code}
                      </span>
                    )}
                  </div>

                  {/* Timing & Admin Details */}
                  <div className="text-[11px] font-semibold text-[#78716C] flex items-center gap-2 flex-wrap pt-0.5">
                    <span>Created: {fmtDate(p.created_at)}</span>
                    {p.claimed_at && (
                      <span className="text-amber-700 font-bold">• Claimed: {fmtDate(p.claimed_at)}</span>
                    )}
                    {p.approved_at && (
                      <span className="text-emerald-700 font-bold">• Approved: {fmtDate(p.approved_at)}</span>
                    )}
                    {p.rejection_reason && (
                      <span className="text-rose-700 font-bold">• Reason: {p.rejection_reason}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {(isClaimed || isPending || isExpired) && (
                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => handleApprove(p.id)}
                      disabled={isActing}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold uppercase text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      {isActing && loading.endsWith('approve') ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      <span>{isExpired ? 'Override Approve' : 'Approve'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setRejectModalId(p.id);
                        setRejectReason('');
                      }}
                      disabled={isActing}
                      className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 font-bold uppercase text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#E7E5E4] anim-scale-in">
            <h3 className="text-base font-bold text-[#1C1917]">Reject Payment Reservation</h3>
            <p className="text-xs text-[#78716C] font-semibold">
              Enter reason for rejection (this will be notified to the user):
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Amount not received in UPI statement"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] text-xs font-semibold outline-none focus:border-[var(--accent)]"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectModalId(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-[#78716C] bg-[#FAFAF8] border border-[#E7E5E4] hover:bg-[#F5F5F4] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={loading.endsWith('reject')}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading.endsWith('reject') ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
