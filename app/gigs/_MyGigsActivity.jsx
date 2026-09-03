'use client';
import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, CheckCircle2, XCircle, Hourglass, FileText, Send, Users, Zap, RefreshCw, MessageCircle, Phone, Star, Trash2, X } from '@/lib/icons';
import Link from 'next/link';
import useSWR from 'swr';
import { toast } from '../../lib/toast';
import RatingReviewModal from '../../components/RatingReviewModal';

const fetcher = url => fetch(url).then(r => r.json());

const STATUS_STYLE = {
  PENDING:   { icon: <Hourglass size={12}/>,     label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED:  { icon: <CheckCircle2 size={12}/>,  label: 'Accepted',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:  { icon: <XCircle size={12}/>,       label: 'Rejected',  cls: 'bg-red-50 text-red-500 border-red-200' },
  COMPLETED: { icon: <CheckCircle2 size={12}/>,  label: 'Completed', cls: 'bg-orange-50 text-[#D94F00] border-orange-200' },
};

export default function MyGigsActivity({ userId, onManage, initialTab = 'posted' }) {
  const [tab, setTab] = useState(initialTab); // 'posted' | 'applied'
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingModalData, setRatingModalData] = useState(null);
  const [reviewedGigs, setReviewedGigs] = useState(new Set());
  const [cancellingGigId, setCancellingGigId] = useState(null);
  const [withdrawingAppId, setWithdrawingAppId] = useState(null);

  useEffect(() => {
    try {
      const reviewed = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('reviewed_gig_')) {
          reviewed.add(k.replace('reviewed_gig_', ''));
        }
      }
      setReviewedGigs(reviewed);
    } catch {}
  }, []);

  const openRatingModal = (data) => {
    setRatingModalData(data);
    setShowRatingModal(true);
  };

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const { data: gigsData, mutate: mutateGigs } = useSWR('/api/gigs', fetcher);
  const { data: myAppsData, mutate: mutateApps } = useSWR(
    userId ? `/api/users/${userId}/applications` : null,
    fetcher
  );

  const handleCancelGig = async (gig) => {
    const budget = gig.budget || gig.reward_sparks || 0;
    if (!confirm(`Are you sure you want to cancel this gig? ${budget} Sparks in escrow will be immediately refunded to your wallet.`)) return;
    setCancellingGigId(gig.id);
    try {
      const res = await fetch(`/api/gigs/${gig.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Gig cancelled. Escrow refunded.');
        mutateGigs();
      } else {
        toast.error(data.error || 'Failed to cancel gig');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setCancellingGigId(null);
    }
  };

  const handleWithdrawApp = async (app) => {
    if (!confirm('Are you sure you want to withdraw your application?')) return;
    setWithdrawingAppId(app.gigId);
    try {
      const res = await fetch(`/api/gigs/${app.gigId}/apply`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Application withdrawn.');
        mutateApps();
      } else {
        toast.error(data.error || 'Failed to withdraw application');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setWithdrawingAppId(null);
    }
  };

  const allGigs = gigsData?.gigs || [];
  const postedGigs = allGigs.filter(g => g.authorId === userId || g.author_id === userId || g.host_id === userId);
  const myApplications = myAppsData?.applications || [];

  const renderStatusBadge = (status) => {
    if (status === 'in_progress') {
      return <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full"><RefreshCw size={11} className="animate-spin" /> In Progress</span>;
    }
    if (status === 'completed') {
      return <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full"><CheckCircle2 size={11} /> Completed</span>;
    }
    if (status === 'expired') {
      return <span className="flex items-center gap-1 text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full"><Clock size={11} /> Expired</span>;
    }
    return <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open</span>;
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 border border-zinc-200/80 rounded-2xl">
        {[
          { key: 'posted', label: `My Posted Gigs (${postedGigs.length})`, icon: FileText },
          { key: 'applied', label: `My Applications (${myApplications.length})`, icon: Send }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tab === key ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Icon size={14} className={tab === key ? 'text-[#F05A00]' : 'text-zinc-400'} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Posted gigs */}
      {tab === 'posted' && (
        <div className="space-y-3">
          {postedGigs.length === 0 && (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-zinc-100 shadow-xs">
              <Briefcase size={28} className="mx-auto mb-2 text-zinc-300"/>
              <p className="text-sm font-bold text-zinc-800">No gigs posted yet</p>
              <p className="text-xs text-zinc-400 mt-1">Post a campus gig to hire talented student peers.</p>
            </div>
          )}
          {postedGigs.map(gig => (
            <div key={gig.id} className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2.5 hover:border-orange-200 transition-all shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-zinc-900">{gig.title}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{gig.category || 'Freelance'} · {gig.duration || 'Flexible'}</p>
                </div>
                {renderStatusBadge(gig.status)}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  {gig.budget || gig.reward_sparks || 0} <Zap size={11} className="fill-current text-amber-500" />
                </span>
                <div className="flex items-center gap-1.5">
                  {gig.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleCancelGig(gig)}
                      disabled={cancellingGigId === gig.id}
                      className="px-2.5 py-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      title="Cancel Gig & Refund Escrow"
                    >
                      <Trash2 size={12} />
                      <span>Cancel</span>
                    </button>
                  )}
                  <button
                    onClick={() => onManage(gig)}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-50 text-[#D94F00] border border-orange-100 text-xs font-black hover:bg-orange-100 cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    {(gig.applicationsCount || gig.applications_count || 0) > 0 ? (
                      <>
                        <Users size={13} />
                        <span>{gig.applicationsCount || gig.applications_count} Applied</span>
                      </>
                    ) : (
                      <span>Manage</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applied gigs */}
      {tab === 'applied' && (
        <div className="space-y-3">
          {!myAppsData && <p className="text-xs text-zinc-400 text-center py-8">Loading applications…</p>}
          {myAppsData && myApplications.length === 0 && (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-zinc-100 shadow-xs">
              <Clock size={28} className="mx-auto mb-2 text-zinc-300"/>
              <p className="text-sm font-bold text-zinc-800">No applications yet</p>
              <p className="text-xs text-zinc-400 mt-1">Browse open campus gigs and apply to start earning Sparks.</p>
            </div>
          )}
          {myApplications.map(app => {
            const rawStatus = (app.status || 'pending').toUpperCase();
            const st = STATUS_STYLE[rawStatus] || STATUS_STYLE.PENDING;

            return (
              <div key={app.id || (app.gigId + '-' + (app.appliedAt || ''))} className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-3 shadow-xs hover:border-orange-200 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-zinc-900 truncate">{app.gigTitle || 'Campus Gig'}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shrink-0 ${st.cls}`}>
                    {st.icon} {st.label}
                  </span>
                </div>

                {app.pitch && (
                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-600 italic">
                    &ldquo;{app.pitch}&rdquo;
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                  <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    {app.gigBudget || 0} <Zap size={11} className="fill-current text-amber-500" />
                  </span>

                  {['PENDING', 'ACCEPTED'].includes(rawStatus) && (
                    <button
                      type="button"
                      onClick={() => handleWithdrawApp(app)}
                      disabled={withdrawingAppId === app.gigId}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>

                {rawStatus === 'ACCEPTED' && app.meetingCode && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 mb-1">
                      Completion Security Code
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold mb-2">
                      Share this code with the host once your work is completed to release Sparks:
                    </p>
                    <div className="py-2 px-4 bg-white rounded-xl border border-emerald-200 text-center mb-3">
                      <span className="text-2xl font-black tracking-[6px] text-emerald-800 font-mono">
                        {app.meetingCode}
                      </span>
                    </div>
                    {app.gigAuthorId && (
                      <div className="flex items-center gap-2">
                        <Link href={`/messages?uid=${app.gigAuthorId}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-100 transition-colors">
                          <MessageCircle size={14} /> Message Host
                        </Link>
                        <button onClick={() => {
                          setTimeout(() => window.location.href = `/messages?uid=${app.gigAuthorId}`, 500);
                        }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F05A00] text-white rounded-xl text-xs font-black hover:bg-[#D94F00] transition-colors shadow-sm cursor-pointer">
                          <Phone size={14} /> Secure Call
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {rawStatus === 'COMPLETED' && (
                  <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-[#F05A00] font-black">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Task Completed</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openRatingModal({
                        targetUserId: app.gigAuthorId || app.authorId,
                        targetName: app.gigAuthorName || 'Gig Client',
                        targetPhoto: app.gigAuthorPhoto || '',
                        contextType: 'gig',
                        contextTitle: app.gigTitle || 'Campus Gig',
                        gigId: app.gigId,
                      })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs ${
                        reviewedGigs.has(app.gigId)
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          : 'bg-[#F05A00] hover:bg-[#D94F00] text-white shadow-xs'
                      }`}
                    >
                      <Star size={13} className={reviewedGigs.has(app.gigId) ? 'fill-amber-400 text-amber-500' : 'fill-white text-white'} />
                      <span>{reviewedGigs.has(app.gigId) ? 'Rated ★' : 'Rate Client'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: RATING & REVIEWS ─── */}
      {showRatingModal && ratingModalData && (
        <RatingReviewModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingModalData(null);
          }}
          targetUserId={ratingModalData.targetUserId}
          targetName={ratingModalData.targetName}
          targetPhoto={ratingModalData.targetPhoto}
          contextType="gig"
          contextTitle={ratingModalData.contextTitle}
          gigId={ratingModalData.gigId}
          onSuccess={({ rating }) => {
            if (ratingModalData.gigId) {
              setReviewedGigs(prev => new Set([...prev, ratingModalData.gigId]));
            }
          }}
        />
      )}
    </div>
  );
}
