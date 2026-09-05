'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Check, X, Loader2, AlertCircle, Clock,
  ExternalLink, User, Calendar, RefreshCw
} from '@/lib/icons';

const REJECTION_REASONS = [
  'Face and ID do not match',
  'ID document is blurred or unreadable',
  'Expired or invalid student credentials',
  'Selfie lacks clear lighting or obstructions detected',
  'Duplicate submission with conflicting details',
];

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('pending'); // 'pending' | 'all' | 'approved' | 'rejected'
  const [rejectingId, setRejectingId] = useState(null);
  const [customReason, setCustomReason] = useState(REJECTION_REASONS[0]);

  const loadRequests = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/verifications');
      if (!res.ok) throw new Error('Failed to load verification requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error loading verification records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (requestId, action, reason) => {
    setProcessingId(requestId);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setRejectingId(null);
      loadRequests();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-[26px] p-5 md:p-6 border border-[#E7E5E4]/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1C1917] tracking-tight">Identity &amp; Trust Desk</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]">
              {requests.filter(r => r.status === 'pending').length} Pending
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-1 font-medium">
            Review live selfie against college ID documents to verify student accounts and unlock campus rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#FAFAF8] p-1 rounded-full border border-[#E7E5E4]">
            {['pending', 'approved', 'rejected', 'all'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={loadRequests}
            disabled={loading}
            className="p-2.5 rounded-full bg-[#FAFAF8] hover:bg-[#F5F5F4] text-[#1C1917] border border-[#E7E5E4] transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of Verification Requests */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Loading verification queue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[26px] p-12 text-center border border-[#E7E5E4]/[0.08] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#1C1917]">No requests in this queue</h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto font-medium">
            All submitted student verifications have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(req => {
            const isProcessing = processingId === req.id;
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className="bg-white rounded-[28px] p-5 border border-[#E7E5E4]/[0.08] shadow-xs flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-[#FAFAF8] border border-[#E7E5E4] flex items-center justify-center flex-shrink-0">
                      {req.current_photo_url ? (
                        <img src={req.current_photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-[#A8A29E]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1C1917] truncate">{req.full_name}</p>
                      <p className="text-[11px] text-[#78716C] truncate">{req.email || `@${req.username || 'student'}`}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isPending
                      ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                      : isApproved
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                  }`}>
                    {req.status}
                  </span>
                </div>

                {/* Side-by-Side Images */}
                <div className="grid grid-cols-2 gap-3 bg-[#FAFAF8] p-3 rounded-2xl border border-[#E7E5E4]">
                  {/* Live Selfie */}
                  <div className="space-y-1 text-center">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
                      Live Selfie
                    </span>
                    <div className="aspect-square rounded-xl overflow-hidden bg-white border border-[#E7E5E4] relative group">
                      <img src={req.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                      <a
                        href={req.selfie_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>

                  {/* ID Document */}
                  <div className="space-y-1 text-center">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
                      College ID Document
                    </span>
                    <div className="aspect-square rounded-xl overflow-hidden bg-white border border-[#E7E5E4] relative group">
                      <img src={req.id_document_url} alt="ID Document" className="w-full h-full object-cover" />
                      <a
                        href={req.id_document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Meta details */}
                <div className="flex items-center justify-between text-[11px] text-[#78716C] pt-1">
                  <span>Submitted: {new Date(req.submitted_at || req.created_at).toLocaleDateString()}</span>
                  <span>Past Rejections: <strong className="text-[#1C1917]">{req.rejection_count || 0}</strong></span>
                </div>

                {/* Rejection Note if already rejected */}
                {isRejected && req.rejection_reason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium">
                    Reason: {req.rejection_reason}
                  </div>
                )}

                {/* Actions for Pending */}
                {isPending && (
                  <div className="pt-2">
                    {rejectingId === req.id ? (
                      <div className="space-y-2.5 p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl">
                        <label className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                          Select Rejection Reason
                        </label>
                        <select
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-rose-300 bg-white text-xs font-semibold text-[#1C1917] focus:outline-none"
                        >
                          {REJECTION_REASONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAction(req.id, 'reject', customReason)}
                            disabled={isProcessing}
                            className="flex-1 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                          >
                            {isProcessing ? 'Confirming...' : 'Confirm Reject'}
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="px-4 py-2 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917] text-xs font-bold uppercase tracking-wider hover:bg-[#F5F5F4] transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, 'approve')}
                          disabled={isProcessing}
                          className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                          <span>Approve &amp; Verify</span>
                        </button>

                        <button
                          onClick={() => {
                            setRejectingId(req.id);
                            setCustomReason(REJECTION_REASONS[0]);
                          }}
                          disabled={isProcessing}
                          className="px-5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
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