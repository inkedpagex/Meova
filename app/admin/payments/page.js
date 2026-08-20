'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Zap, Clock, RefreshCw } from 'lucide-react';

function fmt(n) { return (n || 0).toLocaleString('en-IN'); }
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLE = {
  pending:  { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   label: 'Pending' },
  approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Approved' },
  rejected: { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    label: 'Rejected' },
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter]     = useState('pending'); // 'pending' | 'all'
  const [loading, setLoading]   = useState('');
  const [result, setResult]     = useState(null);

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list-payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      const all = data.payments || [];
      // Newest first
      setPayments([...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error('[AdminPaymentsPage] load error:', err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPayments();
    // Auto-refresh every 20s
    const interval = setInterval(loadPayments, 20000);
    return () => clearInterval(interval);
  }, [loadPayments]);

  async function handleAction(id, approve) {
    setLoading(id + (approve ? '_approve' : '_reject'));
    setResult(null);

    // Store original state for potential rollback
    const originalPayments = [...payments];
    
    // Optimistic Update: Update status instantly in the UI
    setPayments(prev =>
      prev.map(p => p.id === id ? { ...p, status: approve ? 'approved' : 'rejected' } : p)
    );

    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: approve ? 'approve' : 'reject'
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, message: `Payment ${approve ? 'approved — Sparks credited to user wallet!' : 'rejected — user notified.'}` });
      } else {
        setResult({ ok: false, message: data.error || 'Action failed.' });
        setPayments(originalPayments); // Rollback
      }
      loadPayments();
    } catch (e) {
      setResult({ ok: false, message: e.message });
      setPayments(originalPayments); // Rollback
    } finally {
      setLoading('');
    }
  }

  const shown = filter === 'pending'
    ? payments.filter(p => p.status === 'pending')
    : payments;

  return (
    <div className="anim-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Payment Verification
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Verify UPI payments and credit Sparks to user wallets.
          </p>
        </div>
        <button
          onClick={loadPayments}
          className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['pending', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              filter === f
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f === 'pending' ? `Pending (${payments.filter(p => p.status === 'pending').length})` : `All (${payments.length})`}
          </button>
        ))}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`p-3.5 rounded-xl border text-sm font-bold flex items-center gap-2 ${
          result.ok
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {result.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {result.message}
        </div>
      )}

      {/* Payments list */}
      {shown.length === 0 ? (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center">
          <Zap size={24} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-bold text-[var(--text-muted)]">
            {filter === 'pending' ? 'No pending payments 🎉' : 'No payment requests yet'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map(p => {
            const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending;
            const isActing = loading.startsWith(p.id);
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                  p.status === 'pending'
                    ? 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'
                    : `${st.bg} ${st.border} border opacity-70`
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-[var(--text-primary)]">
                      {p.pack_name} Pack — {fmt(p.sparks)} ⚡
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${st.color} ${st.bg} ${st.border}`}>
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] font-bold">{p.email}</p>
                  <div className="flex items-center gap-4 flex-wrap text-[10px] font-bold text-[var(--text-secondary)] mt-1">
                    <span className="text-[14px] text-emerald-400 font-black px-2.5 py-1 bg-emerald-500/10 rounded-lg">₹{p.amount_inr}</span>
                    {p.reference_code && (
                      <span>Ref: <code className="font-mono text-amber-400 tracking-widest">{p.reference_code}</code></span>
                    )}
                    <span>{fmtDate(p.created_at)}</span>
                  </div>
                </div>

                {p.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(p.id, true)}
                      disabled={isActing}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black uppercase text-[10px] px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(p.id, false)}
                      disabled={isActing}
                      className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent disabled:opacity-50 font-black uppercase text-[10px] px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
