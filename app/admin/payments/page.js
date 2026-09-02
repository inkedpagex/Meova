'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Zap, Clock, RefreshCw, Loader2 } from 'lucide-react';

function fmt(n) { return (n || 0).toLocaleString('en-IN'); }
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLE = {
  pending:  { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Pending' },
  approved: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Approved' },
  rejected: { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    label: 'Rejected' },
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter]     = useState('pending'); // 'pending' | 'all'
  const [loading, setLoading]   = useState('');
  const [result, setResult]     = useState(null);
  const [fetching, setFetching] = useState(true);

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
    const interval = setInterval(loadPayments, 20000);
    return () => clearInterval(interval);
  }, [loadPayments]);

  async function handleAction(id, approve) {
    setLoading(id + (approve ? '_approve' : '_reject'));
    setResult(null);

    const originalPayments = [...payments];
    setPayments(prev =>
      prev.map(p => p.id === id ? { ...p, status: approve ? 'approved' : 'rejected' } : p)
    );

    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: approve ? 'approve' : 'reject' })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, message: `Payment ${approve ? 'approved — Sparks credited to user wallet!' : 'rejected — user notified.'}` });
      } else {
        setResult({ ok: false, message: data.error || 'Action failed.' });
        setPayments(originalPayments);
      }
      loadPayments();
    } catch (e) {
      setResult({ ok: false, message: e.message });
      setPayments(originalPayments);
    } finally {
      setLoading('');
    }
  }

  const shown = filter === 'pending'
    ? payments.filter(p => p.status === 'pending')
    : payments;

  return (
    <div className="anim-fade-in space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Payment Verification
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
            Verify student UPI payments and credit Sparks directly to their wallets.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={fetching ? 'animate-spin text-[#F05A00]' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 w-fit">
        {['pending', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              filter === f
                ? 'bg-[#F05A00] text-white shadow-xs border border-[#F05A00]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-semibold'
            }`}
          >
            {f === 'pending' ? `Pending (${payments.filter(p => p.status === 'pending').length})` : `All (${payments.length})`}
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
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 size={24} className="animate-spin text-[#F05A00]" />
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Fetching payment records...</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <Zap size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-800">
            {filter === 'pending' ? 'No pending payment requests' : 'No payment records yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(p => {
            const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending;
            const isActing = loading.startsWith(p.id);

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900">
                      {p.pack_name || `${p.sparks} Sparks`} — {fmt(p.sparks)} ⚡
                    </p>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${st.color} ${st.bg} ${st.border}`}>
                      {st.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-bold">{p.email}</p>

                  <div className="flex items-center gap-3 flex-wrap text-xs font-bold text-slate-500 pt-1">
                    <span className="text-xs text-emerald-700 font-black px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                      ₹{p.amount_inr}
                    </span>
                    {p.reference_code && (
                      <span>Ref: <code className="font-mono text-amber-700 font-black px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">{p.reference_code}</code></span>
                    )}
                    <span className="text-slate-400">• {fmtDate(p.created_at)}</span>
                  </div>
                </div>

                {(p.status || '').toLowerCase() === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0 mt-3 sm:mt-0">
                    <button
                      onClick={() => handleAction(p.id, true)}
                      disabled={isActing}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black uppercase text-[11px] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(p.id, false)}
                      disabled={isActing}
                      className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 font-black uppercase text-[11px] px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <XCircle size={14} /> Reject
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
