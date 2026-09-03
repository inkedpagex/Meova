'use client';
import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Search, ArrowUpRight, Loader2 } from '@/lib/icons';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list-withdrawals');
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  async function handleWithdrawal(id, action) {
    setActionLoading(id);
    const originalWithdrawals = [...withdrawals];

    setWithdrawals(prev =>
      prev.map(w => w.id === id ? { ...w, status: action === 'approve' ? 'approved' : 'rejected' } : w)
    );

    try {
      const res = await fetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: id,
          action,
          remarks: remarks[id] || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Withdrawal successfully ${action}d!`);
        fetchWithdrawals();
      } else {
        alert(data.error || 'Failed to update withdrawal');
        setWithdrawals(originalWithdrawals);
      }
    } catch {
      alert('Network error');
      setWithdrawals(originalWithdrawals);
    } finally {
      setActionLoading(null);
    }
  }

  const pending = withdrawals.filter(w => w.status === 'pending');
  const completed = withdrawals.filter(w => w.status !== 'pending');

  return (
    <div className="anim-fade-in space-y-6">
      
      {/* Title Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Withdrawal Requests
        </h1>
        <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
          Review and approve Creator Earnings withdrawal requests. Payouts must be sent to the student&apos;s UPI ID or bank details below.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 size={24} className="animate-spin text-[#6D28D9]" />
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Loading payout requests...</p>
        </div>
      ) : (
        <>
          {/* Pending Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Pending Approvals ({pending.length})</span>
            </h2>

            {pending.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
                <p className="text-sm font-bold text-slate-800">No pending payout requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(w => (
                  <div
                    key={w.id}
                    className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-emerald-600">
                          ₹{w.amount_inr || w.amount} <span className="text-xs font-bold text-slate-400">({w.sparks || w.sparks_deducted || w.amount || 0} Sparks)</span>
                        </p>
                        <p className="text-xs font-extrabold text-slate-900">
                          Requested by: <span className="text-[#6D28D9]">{w.email}</span>
                        </p>
                        <p className="text-[11px] font-bold text-slate-400">
                          Date: {new Date(w.requested_at || w.created_at || Date.now()).toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Payment Destination Details */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl min-w-[220px]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Payout Target ({w.method || 'UPI'})
                        </p>
                        {w.method === 'bank' ? (
                          <div className="text-xs font-bold text-slate-800 space-y-0.5">
                            <p>Bank: {w.bank_details?.bank_name || 'N/A'}</p>
                            <p>A/C: {w.bank_details?.account_number || 'N/A'}</p>
                            <p>IFSC: {w.bank_details?.ifsc_code || 'N/A'}</p>
                          </div>
                        ) : (
                          <p className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-md">
                            {w.upi_id || 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Block */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center pt-2 border-t border-slate-100">
                      <input
                        placeholder="Remarks / transaction ref code (optional)..."
                        value={remarks[w.id] || ''}
                        onChange={e => setRemarks({ ...remarks, [w.id]: e.target.value })}
                        className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6D28D9]"
                      />
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleWithdrawal(w.id, 'approve')}
                          disabled={actionLoading === w.id}
                          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold uppercase text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Approve & Pay
                        </button>
                        <button
                          onClick={() => handleWithdrawal(w.id, 'reject')}
                          disabled={actionLoading === w.id}
                          className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 font-bold uppercase text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Processed History ({completed.length})
            </h2>

            {completed.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
                <p className="text-xs font-bold text-slate-400">No past withdrawal requests recorded.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completed.map(w => {
                  const isApp = w.status === 'approved' || w.status === 'paid';
                  return (
                    <div
                      key={w.id}
                      className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {w.sparks || w.sparks_deducted || w.amount || 0} Sparks — {w.email}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                          Remarks: {w.remarks || 'None'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                        isApp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isApp ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {w.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
