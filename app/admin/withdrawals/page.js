'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, CheckCircle, XCircle, Search, ArrowUpRight, Loader2,
  Copy, Check, Building2, Smartphone, ShieldCheck, AlertCircle, X, RefreshCw
} from '@/lib/icons';
import { toast } from '@/lib/toast';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'paid' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal State
  const [modalState, setModalState] = useState(null); // { type: 'approve' | 'reject', item: wd }
  const [utrInput, setUtrInput] = useState('');
  const [remarksInput, setRemarksInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list-withdrawals');
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch withdrawal list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleOpenApprove = (wd) => {
    setModalState({ type: 'approve', item: wd });
    setUtrInput('');
    setRemarksInput('');
  };

  const handleOpenReject = (wd) => {
    setModalState({ type: 'reject', item: wd });
    setRemarksInput('');
  };

  const handleCloseModal = () => {
    setModalState(null);
    setUtrInput('');
    setRemarksInput('');
  };

  const handleConfirmAction = async () => {
    if (!modalState) return;
    const { type, item } = modalState;

    if (type === 'approve' && !utrInput.trim()) {
      toast.error('Please enter the bank UTR / UPI transaction reference ID');
      return;
    }

    if (type === 'reject' && !remarksInput.trim()) {
      toast.error('Please enter a rejection reason for the user');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: item.id,
          action: type,
          payoutReference: utrInput.trim(),
          remarks: remarksInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(type === 'approve' ? 'Withdrawal marked as Paid!' : 'Withdrawal rejected and Sparks refunded');
        handleCloseModal();
        fetchWithdrawals();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = withdrawals.filter(w => {
    if (filter === 'pending') return w.status === 'pending';
    if (filter === 'paid') return w.status === 'paid' || w.status === 'approved';
    if (filter === 'rejected') return w.status === 'rejected';
    return true;
  }).filter(w => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (w.email || '').toLowerCase().includes(q) ||
      (w.user_name || '').toLowerCase().includes(q) ||
      (w.upi_id || '').toLowerCase().includes(q) ||
      (w.remarks || '').toLowerCase().includes(q)
    );
  });

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="anim-fade-in space-y-6 pb-20 max-w-6xl mx-auto">
      
      {/* Title Header */}
      <div className="bg-white p-6 rounded-[28px] border border-[#E7E5E4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
            <span>Withdrawal Management</span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--accent)] text-white">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="text-xs font-semibold text-[#78716C] mt-1">
            Review and execute Creator Earnings payouts. Verify UPI / Bank details and enter payment UTR on payout.
          </p>
        </div>

        <button
          onClick={fetchWithdrawals}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF8] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: `All (${withdrawals.length})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'paid', label: `Paid (${withdrawals.filter(w => w.status === 'paid' || w.status === 'approved').length})` },
            { key: 'rejected', label: `Rejected (${withdrawals.filter(w => w.status === 'rejected').length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-white text-[#78716C] hover:text-[#1C1917] border border-[#E7E5E4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search email, name, UPI..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#1C1917] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-16 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
          <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Loading payout queue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-12 text-center shadow-xs">
          <p className="text-sm font-bold text-[#1C1917]">No withdrawal requests found</p>
          <p className="text-xs text-[#78716C] mt-1">There are no withdrawal requests matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(w => {
            const isPending = w.status === 'pending';
            const isPaid = w.status === 'paid' || w.status === 'approved';
            const isRejected = w.status === 'rejected';
            const amt = Number(w.amount || w.sparks || w.rupees || 0);

            return (
              <div
                key={w.id}
                className="bg-white border border-[#E7E5E4] p-6 rounded-[24px] shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Amount & User Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-[#1C1917] tracking-tight">
                        ₹{amt.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-[#78716C]">
                        ({amt} Sparks)
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isPaid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        isRejected ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {isPaid && <Check size={10} strokeWidth={3} />}
                        {isPending && <Clock size={10} />}
                        {isRejected && <X size={10} />}
                        <span>{w.status}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#78716C]">
                      <span className="text-[#1C1917] font-bold">{w.user_name || 'User'}</span>
                      <span>·</span>
                      <span className="text-[var(--accent)] font-bold">{w.user_email || w.email}</span>
                      <span>·</span>
                      <span>Phone: {w.phone || 'N/A'} {w.phone_verified && <span className="text-emerald-700 font-bold">(Verified)</span>}</span>
                    </div>

                    <p className="text-[11px] font-semibold text-[#78716C]">
                      Requested on: {new Date(w.requested_at || w.created_at || Date.now()).toLocaleString('en-IN', {
                        dateStyle: 'medium', timeStyle: 'short'
                      })}
                    </p>
                  </div>

                  {/* Payment Target Box */}
                  <div className="bg-[#FAFAF8] border border-[#E7E5E4] p-3.5 rounded-[18px] min-w-[260px] w-full lg:w-auto">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#78716C] flex items-center gap-1">
                        {w.method === 'bank' ? <Building2 size={12} /> : <Smartphone size={12} />}
                        <span>{w.method === 'bank' ? 'Bank Account' : 'UPI Target'}</span>
                      </span>
                      {w.method === 'upi' && w.upi_id && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(w.upi_id, `upi_${w.id}`)}
                          className="text-[10px] font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `upi_${w.id}` ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copiedId === `upi_${w.id}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    {w.method === 'bank' && w.bank_details ? (
                      <div className="text-xs font-semibold text-[#1C1917] space-y-0.5">
                        <p><strong className="font-bold">Name:</strong> {w.bank_details.account_name || 'N/A'}</p>
                        <p><strong className="font-bold">A/C:</strong> {w.bank_details.account_number || 'N/A'}</p>
                        <p><strong className="font-bold">IFSC:</strong> {w.bank_details.ifsc_code || 'N/A'}</p>
                        <p><strong className="font-bold">Bank:</strong> {w.bank_details.bank_name || 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-mono font-bold text-[#1C1917] bg-white border border-[#E7E5E4] px-2.5 py-1.5 rounded-lg">
                        {w.upi_id || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status / Actions Bar */}
                <div className="pt-3 border-t border-[#E7E5E4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-[#78716C] truncate max-w-md">
                    {w.remarks ? (
                      <span><strong className="text-[#1C1917]">Audit Note:</strong> {w.remarks}</span>
                    ) : (
                      <span>No additional remarks</span>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleOpenApprove(w)}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer whitespace-nowrap flex-shrink-0"
                      >
                        Approve & Pay
                      </button>
                      <button
                        onClick={() => handleOpenReject(w)}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve & Pay Modal */}
      {modalState?.type === 'approve' && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md anim-fade-in cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[32px] w-full max-w-[420px] p-6 shadow-2xl border border-[#E7E5E4] anim-scale-in cursor-default space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1C1917]">Confirm Payout</h3>
              <button onClick={handleCloseModal} className="text-[#78716C] hover:text-[#1C1917] p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-[#FAFAF8] rounded-[20px] border border-[#E7E5E4] space-y-1">
              <p className="text-xs text-[#78716C] font-semibold">Paying</p>
              <p className="text-2xl font-bold text-emerald-600">
                ₹{Number(modalState.item.amount || modalState.item.sparks || 0).toLocaleString()}
              </p>
              <p className="text-xs font-bold text-[#1C1917] mt-1">
                To: {modalState.item.method === 'upi' ? modalState.item.upi_id : `${modalState.item.bank_details?.account_name} (${modalState.item.bank_details?.account_number})`}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                Bank UTR / Payout Reference <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 424212345678 or SBI-UPI-99238"
                value={utrInput}
                onChange={e => setUtrInput(e.target.value)}
                required
                className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C1917] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                Admin Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="Paid via SBI corporate portal"
                value={remarksInput}
                onChange={e => setRemarksInput(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1C1917] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-3 rounded-full text-xs font-bold text-[#78716C] bg-white border border-[#E7E5E4] hover:bg-[#FAFAF8] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading || !utrInput.trim()}
                className="flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modalState?.type === 'reject' && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md anim-fade-in cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[32px] w-full max-w-[420px] p-6 shadow-2xl border border-[#E7E5E4] anim-scale-in cursor-default space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-600">Reject Withdrawal</h3>
              <button onClick={handleCloseModal} className="text-[#78716C] hover:text-[#1C1917] p-1">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#78716C] font-medium leading-relaxed">
              Rejecting this request will immediately insert a compensating reversal credit in the user&apos;s ledger to return <strong className="text-[#1C1917]">₹{Number(modalState.item.amount || modalState.item.sparks || 0)} Sparks</strong> back to their withdrawable earned balance.
            </p>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                Rejection Reason (Sent to User) <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Invalid UPI ID / Incorrect Bank Account number"
                value={remarksInput}
                onChange={e => setRemarksInput(e.target.value)}
                required
                className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl p-3 text-xs font-semibold text-[#1C1917] outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-3 rounded-full text-xs font-bold text-[#78716C] bg-white border border-[#E7E5E4] hover:bg-[#FAFAF8] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading || !remarksInput.trim()}
                className="flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

