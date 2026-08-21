'use client';
import React, { useState } from 'react';
import { Briefcase, Clock, CheckCircle2, XCircle, Hourglass } from 'lucide-react';
import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

const STATUS_STYLE = {
  PENDING:   { icon: <Hourglass size={12}/>,     label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED:  { icon: <CheckCircle2 size={12}/>,  label: 'Accepted',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:  { icon: <XCircle size={12}/>,       label: 'Rejected',  cls: 'bg-red-50 text-red-500 border-red-200' },
  COMPLETED: { icon: <CheckCircle2 size={12}/>,  label: 'Completed', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function MyGigsActivity({ userId, onManage }) {
  const [tab, setTab] = useState('posted'); // 'posted' | 'applied'
  const { data: gigsData } = useSWR('/api/gigs', fetcher);
  const { data: myAppsData } = useSWR(
    tab === 'applied' ? `/api/users/${userId}/applications` : null,
    fetcher
  );

  const allGigs = gigsData?.gigs || [];
  const postedGigs = allGigs.filter(g => g.authorId === userId);
  const myApplications = myAppsData?.applications || [];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 rounded-2xl">
        {[['posted','📋 My Posts'],['applied','📨 Applied']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              tab === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Posted gigs */}
      {tab === 'posted' && (
        <div className="space-y-3">
          {postedGigs.length === 0 && (
            <div className="text-center py-10 text-zinc-400">
              <Briefcase size={28} className="mx-auto mb-2 text-zinc-300"/>
              <p className="text-sm font-bold">No gigs posted yet</p>
              <p className="text-xs mt-1">Post a gig to hire student freelancers</p>
            </div>
          )}
          {postedGigs.map(gig => {
            const statusLabel = gig.status === 'in_progress' ? '🔄 In Progress'
              : gig.status === 'completed' ? '✅ Completed'
              : gig.status === 'expired' ? '⏱ Expired'
              : '🟢 Open';
            return (
              <div key={gig.id} className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2 hover:border-purple-200 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-zinc-900">{gig.title}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{gig.category} · {gig.duration}</p>
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 whitespace-nowrap">{statusLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-600">{gig.budget}⚡</span>
                  <button
                    onClick={() => onManage(gig)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 text-xs font-black hover:bg-purple-100 cursor-pointer transition-all"
                  >
                    {(gig.applicationsCount || 0) > 0
                      ? `👥 ${gig.applicationsCount} Applied`
                      : 'Manage'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applied gigs */}
      {tab === 'applied' && (
        <div className="space-y-3">
          {!myAppsData && <p className="text-xs text-zinc-400 text-center py-8">Loading…</p>}
          {myAppsData && myApplications.length === 0 && (
            <div className="text-center py-10 text-zinc-400">
              <Clock size={28} className="mx-auto mb-2 text-zinc-300"/>
              <p className="text-sm font-bold">No applications yet</p>
              <p className="text-xs mt-1">Apply to gigs to start earning Sparks</p>
            </div>
          )}
          {myApplications.map(app => {
            const st = STATUS_STYLE[app.status] || STATUS_STYLE.PENDING;
            return (
              <div key={app.gigId + app.applicantId} className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-zinc-900">{app.gigTitle || 'Gig'}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${st.cls}`}>
                    {st.icon}{st.label}
                  </span>
                </div>
                {app.status === 'ACCEPTED' && app.meetingCode && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Your completion code — share with host</p>
                    <p className="text-2xl font-black tracking-[6px] text-emerald-800">{app.meetingCode}</p>
                  </div>
                )}
                {app.status === 'COMPLETED' && (
                  <p className="text-xs text-purple-600 font-bold">⚡ Sparks credited to your wallet</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
