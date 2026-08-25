'use client';
import React, { useState } from 'react';
import { Briefcase, Clock, CheckCircle2, XCircle, Hourglass, FileText, Send, Users, Zap, RefreshCw } from 'lucide-react';
import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

const STATUS_STYLE = {
  PENDING:   { icon: <Hourglass size={12}/>,     label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED:  { icon: <CheckCircle2 size={12}/>,  label: 'Accepted',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:  { icon: <XCircle size={12}/>,       label: 'Rejected',  cls: 'bg-red-50 text-red-500 border-red-200' },
  COMPLETED: { icon: <CheckCircle2 size={12}/>,  label: 'Completed', cls: 'bg-orange-50 text-[#D94F00] border-orange-200' },
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
      <div className="flex gap-1 p-1 bg-orange-50/60 border border-orange-100/80 rounded-2xl">
        {[
          { key: 'posted', label: 'My Posts', icon: FileText },
          { key: 'applied', label: 'Applied', icon: Send }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tab === key ? 'bg-white text-zinc-900 shadow-sm border border-orange-100/50' : 'text-zinc-500 hover:text-zinc-700'
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
            <div className="text-center py-10 text-zinc-400">
              <Briefcase size={28} className="mx-auto mb-2 text-zinc-300"/>
              <p className="text-sm font-bold">No gigs posted yet</p>
              <p className="text-xs mt-1">Post a gig to hire student freelancers</p>
            </div>
          )}
          {postedGigs.map(gig => (
            <div key={gig.id} className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2 hover:border-[#eac5e0] transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-zinc-900">{gig.title}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{gig.category} · {gig.duration}</p>
                </div>
                {renderStatusBadge(gig.status)}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  {gig.budget} <Zap size={11} className="fill-current text-amber-500" />
                </span>
                <button
                  onClick={() => onManage(gig)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-50 text-[#D94F00] border border-orange-100 text-xs font-black hover:bg-orange-100 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {(gig.applicationsCount || 0) > 0 ? (
                    <>
                      <Users size={13} />
                      <span>{gig.applicationsCount} Applied</span>
                    </>
                  ) : (
                    <span>Manage</span>
                  )}
                </button>
              </div>
            </div>
          ))}
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
                  <p className="text-xs text-[#F05A00] font-bold flex items-center gap-1">
                    <Zap size={12} className="fill-current text-amber-500" />
                    <span>Sparks credited to your wallet</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
