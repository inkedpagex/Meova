'use client';
import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, MessageCircle, User } from 'lucide-react';
import { toast } from '../../lib/toast';
import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

function ApplicantCard({ app, gigId, onUpdate }) {
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
      toast.success(action === 'accept' ? '✅ Accepted! Sparks held in escrow.' : 'Applicant rejected.');
      onUpdate();
    } catch { toast.error('Network error.'); }
    finally { setLoading(null); }
  };

  const statusColor = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-500 border-red-200',
    COMPLETED: 'bg-orange-50 text-[#F05A00] border-orange-200',
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-all">
      {app.applicantPhoto ? (
        <img src={app.applicantPhoto} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-zinc-200" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
          <User size={18} className="text-[#F05A00]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-zinc-900">{app.applicantName}</span>
          {app.applicantUsername && <span className="text-xs text-zinc-400">@{app.applicantUsername}</span>}
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor[app.status] || ''}`}>
            {app.status}
          </span>
        </div>
        {app.applicantBranch && <p className="text-xs text-zinc-400 mt-0.5">{app.applicantBranch}</p>}
        {app.pitch && <p className="text-xs text-zinc-600 mt-2 leading-relaxed italic">"{app.pitch}"</p>}
        {app.status === 'PENDING' && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handle('accept')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={13} />
              {loading === 'accept' ? 'Accepting…' : 'Accept'}
            </button>
            <button
              onClick={() => handle('reject')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-black hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <XCircle size={13} />
              {loading === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        )}
        {app.status === 'ACCEPTED' && (
          <div className="mt-3 p-3 rounded-xl bg-[#fcf6fa] border border-[#f5ebf4]">
            <p className="text-[10px] font-black uppercase text-[#9e4685] mb-1">Gig in Progress</p>
            <p className="text-[11px] font-bold text-[#60234d]">Sparks are held in Escrow. Ask the freelancer for their 6-digit completion code when the work is delivered.</p>
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
      toast.success(`✅ Gig complete! ${json.payout}⚡ paid to freelancer.`);
      mutate();
      onClose();
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
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-100 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 flex-shrink-0">
          <div>
            <h3 className="text-sm font-black text-zinc-900">Applicants</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{gig.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400">
            <X size={16} />
          </button>
        </div>

        {/* Applicant list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {!data && <p className="text-xs text-zinc-400 text-center py-8">Loading…</p>}
          {data && apps.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm font-bold text-zinc-400">No applications yet</p>
              <p className="text-xs text-zinc-300 mt-1">Share this gig to get applicants</p>
            </div>
          )}
          {apps.map(app => (
            <ApplicantCard key={app.id} app={app} gigId={gig.id} onUpdate={mutate} />
          ))}
        </div>

        {/* Complete gig section */}
        {(gig.status === 'in_progress' || acceptedApp) && (
          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex-shrink-0">
            <div className="border-t border-zinc-100 pt-4">
              {!completing ? (
                <button
                  onClick={() => setCompleting(true)}
                  className="w-full py-3 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] text-white text-xs font-black active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  Mark as Completed & Release Sparks ⚡
                </button>
              ) : (
                <form noValidate onSubmit={handleComplete} className="space-y-3">
                  <p className="text-[11px] font-bold text-zinc-500">Enter the 6-digit code the freelancer gives you:</p>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full p-3 rounded-xl border border-zinc-200 text-center text-2xl font-black tracking-[8px] focus:outline-none focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCompleting(false)} className="flex-1 py-3 rounded-2xl bg-zinc-100 text-zinc-600 text-xs font-black cursor-pointer hover:bg-zinc-200">Cancel</button>
                    <button type="submit" disabled={code.length !== 6 || codeLoading} className="flex-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black disabled:opacity-50 cursor-pointer active:scale-95 transition-all shadow-xs">
                      {codeLoading ? 'Verifying…' : 'Confirm & Pay'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
