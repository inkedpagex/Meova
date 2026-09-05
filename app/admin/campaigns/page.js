'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Zap, Clock, RefreshCw, Loader2, ExternalLink, ShieldCheck } from '@/lib/icons';

function InstagramIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLE = {
  pending:  { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Pending Review' },
  approved: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: '100 Sparks Credited' },
  rejected: { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    label: 'Rejected' },
};

export default function AdminCampaignsPage() {
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'all'
  const [loadingAction, setLoadingAction] = useState('');
  const [fetching, setFetching] = useState(true);

  const loadClaims = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/campaigns');
      if (!res.ok) throw new Error('Failed to fetch claims');
      const data = await res.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error('[AdminCampaignsPage] load error:', err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
    const interval = setInterval(loadClaims, 15000);
    return () => clearInterval(interval);
  }, [loadClaims]);

  async function handleAction(claimId, approve) {
    setLoadingAction(claimId + (approve ? '_approve' : '_reject'));

    const originalClaims = [...claims];
    setClaims(prev =>
      prev.map(c => c.id === claimId ? { ...c, status: approve ? 'approved' : 'rejected' } : c)
    );

    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, action: approve ? 'approve' : 'reject' })
      });
      const data = await res.json();
      if (!res.ok) {
        setClaims(originalClaims);
        alert(data.error || 'Action failed');
      } else {
        loadClaims();
      }
    } catch {
      setClaims(originalClaims);
      alert('Network error.');
    } finally {
      setLoadingAction('');
    }
  }

  const approvedCount = claims.filter(c => c.status === 'approved').length;
  const pendingCount = claims.filter(c => c.status === 'pending').length;
  const displayed = filter === 'pending' ? claims.filter(c => c.status === 'pending') : claims;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1C1917] flex items-center gap-2">
            <InstagramIcon className="text-[#E1306C]" size={22} />
            Instagram Story Campaign Claims
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Top 100 students reward offer — Verify Instagram tag @meova.in and credit 100 Sparks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFetching(true); loadClaims(); }}
            disabled={fetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-semibold text-[#78716C] hover:bg-[#FAFAF8] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw size={13} className={fetching ? 'animate-spin text-[var(--accent)]' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E7E5E4] shadow-2xs">
          <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Approved Slots</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount} / 100</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E7E5E4] shadow-2xs">
          <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Pending Review</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E7E5E4] shadow-2xs">
          <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Remaining Free Slots</p>
          <p className="text-2xl font-bold text-[var(--accent)] mt-1">{Math.max(0, 100 - approvedCount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 bg-[#FAFAF8] p-1 rounded-xl w-fit border border-[#E7E5E4]/80">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'pending' ? 'bg-white text-[#1C1917] shadow-2xs' : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'all' ? 'bg-white text-[#1C1917] shadow-2xs' : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          All Claims ({claims.length})
        </button>
      </div>

      {/* Claims List */}
      <div className="bg-white border border-[#E7E5E4] rounded-3xl overflow-hidden shadow-2xs">
        {fetching && claims.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
            <p className="text-xs text-[#78716C] font-medium">Loading story claims...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-[#78716C]">No {filter === 'pending' ? 'pending' : ''} claims found</p>
            <p className="text-xs text-[#A8A29E] mt-1">Student submissions will appear here live in real-time.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {displayed.map((claim) => {
              const st = STATUS_STYLE[claim.status] || STATUS_STYLE.pending;
              const handleClean = (claim.instagram_handle || '').replace(/^@/, '');
              const igProfileUrl = `https://instagram.com/${handleClean}`;

              return (
                <div key={claim.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFAF8]/50 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#1C1917]">{claim.user_name || 'Student'}</span>
                      <span className="text-xs text-[#A8A29E]">({claim.user_email || claim.user_id})</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.color} ${st.border}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#78716C]">
                      <a
                        href={igProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#E1306C] hover:underline"
                      >
                        <InstagramIcon size={13} />
                        @{handleClean}
                        <ExternalLink size={10} />
                      </a>
                      <span className="text-[#A8A29E]">·</span>
                      <span className="text-[#78716C]">{fmtDate(claim.created_at)}</span>
                      <span className="text-[#A8A29E]">·</span>
                      <span className="font-bold text-[var(--accent)] flex items-center gap-0.5">
                        <Zap size={11} className="fill-current" /> +{claim.reward_sparks || 100} Sparks
                      </span>
                    </div>
                  </div>

                  {claim.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(claim.id, false)}
                        disabled={Boolean(loadingAction)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {loadingAction === claim.id + '_reject' ? <Loader2 size={13} className="animate-spin" /> : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleAction(claim.id, true)}
                        disabled={Boolean(loadingAction)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {loadingAction === claim.id + '_approve' ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Approve +100 Sparks
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
