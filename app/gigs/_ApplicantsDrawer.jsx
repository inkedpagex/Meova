'use client';
import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, MessageCircle, User, Phone, Star } from '@/lib/icons';
import Link from 'next/link';
import { toast } from '../../lib/toast';
import useSWR from 'swr';
import RatingReviewModal from '../../components/RatingReviewModal';

const fetcher = url => fetch(url).then(r => r.json());

function ApplicantCard({ app, gigId, onUpdate, onRate, isReviewed }) {
  const [loading, setLoading] = useState(null); // 'accept' | 'reject'

  const handle = async (action) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/gigs/${gigId}/applications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: app.applicantId, action }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed'); return; }
      toast.success(action === 'accept' ? 'Accepted! Sparks held in escrow.' : 'Applicant rejected.');
      onUpdate();
    } catch { toast.error('Network error.'); }
    finally { setLoading(null); }
  };

  const statusColor = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-500 border-red-200',
    COMPLETED: 'bg-[var(--accent-tint-10)] text-[var(--accent)] border-[var(--accent-tint-20)]',
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border border-[#E7E5E4] bg-[#FAFAF8] hover:bg-white transition-all">
      {app.applicantPhoto ? (
        <img src={app.applicantPhoto} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[#E7E5E4]" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[var(--accent-tint-10)] flex items-center justify-center flex-shrink-0 border border-[var(--accent-tint-20)]">
          <User size={18} className="text-[var(--accent)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-[#1C1917]">{app.applicantName}</span>
          {app.applicantUsername && <span className="text-xs text-[#A8A29E]">@{app.applicantUsername}</span>}
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor[app.status] || ''}`}>
            {app.status}
          </span>
        </div>
        {app.applicantBranch && <p className="text-xs text-[#A8A29E] mt-0.5">{app.applicantBranch}</p>}
        {app.pitch && <p className="text-xs text-[#78716C] mt-2 leading-relaxed italic">"{app.pitch}"</p>}
        
        {app.status === 'PENDING' && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handle('accept')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={13} />
              {loading === 'accept' ? 'Accepting…' : 'Accept'}
            </button>
            <button
              onClick={() => handle('reject')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAFAF8] text-[#78716C] text-xs font-bold hover:bg-[#2A2A2A] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <XCircle size={13} />
              {loading === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        )}

        {app.status === 'ACCEPTED' && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)]">
            <p className="text-[10px] font-bold uppercase text-[var(--accent)] mb-1">Gig in Progress</p>
            <p className="text-[11px] font-bold text-[#1C1917] mb-3">Sparks are held in Escrow. Ask the freelancer for their 6-digit completion code when the work is delivered.</p>
            <div className="flex items-center gap-2">
              <Link href={`/messages?uid=${app.applicantId}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[var(--accent-tint-20)] text-[var(--accent)] rounded-xl text-xs font-bold hover:bg-[var(--accent-tint-10)] transition-colors">
                <MessageCircle size={14} /> Message
              </Link>
              <button onClick={() => {
                toast.success('Initiating secure private call...');
                setTimeout(() => window.location.href = `/messages?uid=${app.applicantId}`, 500);
              }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer">
                <Phone size={14} /> Secure Call
              </button>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[var(--accent-tint-20)]/60 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this assignment? The gig will be reopened for other students.')) {
                    handle('cancel_accepted');
                  }
                }}
                disabled={!!loading}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
              >
                Cancel Assignment & Reopen Gig
              </button>
            </div>
          </div>
        )}

        {app.status === 'COMPLETED' && (
          <div className="mt-3 pt-2 border-t border-[#E7E5E4]/80 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 size={13} /> Completed
            </span>
            <button
              onClick={() => onRate(app)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isReviewed
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-2xs'
              }`}
            >
              <Star size={12} className={isReviewed ? 'fill-amber-400 text-amber-500' : 'fill-white text-white'} />
              <span>{isReviewed ? 'Rated ★' : 'Rate Freelancer'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplicantsDrawer({ gig, onClose }) {
  const { data, mutate } = useSWR(
    gig ? `/api/gigs/${gig.id}/applications` : null,
    fetcher
  );
  const [completing, setCompleting] = useState(false);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [reviewedApplicants, setReviewedApplicants] = useState(new Set());

  React.useEffect(() => {
    try {
      const reviewed = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`reviewed_gig_${gig?.id}_`)) {
          reviewed.add(k.replace(`reviewed_gig_${gig?.id}_`, ''));
        }
      }
      setReviewedApplicants(reviewed);
    } catch {}
  }, [gig?.id]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const apps = data?.applications || [];
  const acceptedApp = apps.find(a => a.status === 'ACCEPTED');

  const handleComplete = async (e) => {
    e.preventDefault();
    setCodeLoading(true);
    try {
      const res = await fetch(`/api/gigs/${gig.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed'); return; }
      toast.success(`Gig complete! ${json.payout} Sparks paid to freelancer.`);
      mutate();
      
      // Auto open rating modal for accepted applicant
      if (acceptedApp) {
        setRatingTarget(acceptedApp);
        setShowRatingModal(true);
      } else {
        onClose();
      }
    } catch { toast.error('Network error'); }
    finally { setCodeLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 md:pb-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E7E5E4] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E7E5E4] flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">Applicants</h3>
            <p className="text-[11px] text-[#A8A29E] mt-0.5 font-medium">{gig.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#FAFAF8] text-[#A8A29E] cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Applicant list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {!data && <p className="text-xs text-[#A8A29E] text-center py-8">Loading…</p>}
          {data && apps.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm font-bold text-[#A8A29E]">No applications yet</p>
              <p className="text-xs text-[#A8A29E] mt-1">Share this gig to get applicants</p>
            </div>
          )}
          {apps.map(app => (
            <ApplicantCard
              key={app.id}
              app={app}
              gigId={gig.id}
              onUpdate={mutate}
              onRate={(targetApp) => {
                setRatingTarget(targetApp);
                setShowRatingModal(true);
              }}
              isReviewed={reviewedApplicants.has(app.applicantId)}
            />
          ))}
        </div>

        {/* Complete gig section */}
        {(gig.status === 'in_progress' || acceptedApp) && (
          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex-shrink-0">
            <div className="border-t border-[#E7E5E4] pt-4">
              {!completing ? (
                <button
                  onClick={() => setCompleting(true)}
                  className="w-full py-3 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  Mark as Completed & Release Sparks
                </button>
              ) : (
                <form noValidate onSubmit={handleComplete} className="space-y-3">
                  <p className="text-[11px] font-bold text-[#78716C]">Enter the 6-digit code the freelancer gives you:</p>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full p-3 rounded-xl border border-[#E7E5E4] text-center text-2xl font-bold tracking-[8px] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCompleting(false)} className="flex-1 py-3 rounded-2xl bg-[#FAFAF8] text-[#78716C] text-xs font-bold cursor-pointer hover:bg-[#2A2A2A]">Cancel</button>
                    <button type="submit" disabled={code.length !== 6 || codeLoading} className="flex-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer active:scale-95 transition-all shadow-xs">
                      {codeLoading ? 'Verifying…' : 'Confirm & Pay'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: RATING & REVIEWS ─── */}
      {showRatingModal && ratingTarget && (
        <RatingReviewModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingTarget(null);
            onClose();
          }}
          targetUserId={ratingTarget.applicantId}
          targetName={ratingTarget.applicantName}
          targetPhoto={ratingTarget.applicantPhoto}
          contextType="gig"
          contextTitle={gig.title || 'Campus Gig'}
          gigId={gig.id}
          onSuccess={({ rating }) => {
            if (gig?.id && ratingTarget.applicantId) {
              setReviewedApplicants(prev => new Set([...prev, ratingTarget.applicantId]));
            }
          }}
        />
      )}
    </div>
  );
}
