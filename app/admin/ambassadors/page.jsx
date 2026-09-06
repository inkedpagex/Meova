'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Award, Check, X, Loader2, AlertCircle, Clock,
  ExternalLink, User, Building2, Phone, Mail, Instagram,
  Linkedin, Sparkles, MapPin, RefreshCw, CheckCircle2, ChevronRight
} from '@/lib/icons';

export default function AdminAmbassadorsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState('pending');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/ambassador-applications?status=${filter}`);
      if (!res.ok) throw new Error('Failed to load ambassador applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error loading ambassador records');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleAction = async (applicationId, action) => {
    setProcessingId(applicationId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/ambassador-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} application`);

      if (action === 'approve') {
        setSuccessMsg(`Application approved! Referral code: ${data.referralCode || 'Generated'}`);
      } else {
        setSuccessMsg(`Application status updated to ${action}.`);
      }

      setTimeout(() => setSuccessMsg(''), 4000);
      loadApplications();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'shortlisted':
        return 'bg-purple-50 text-[#7C3AED] border-purple-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-900 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-[28px] bg-white border border-black/10 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-black">
            <Award size={20} />
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">Campus Ambassador Desk</h1>
          </div>
          <p className="text-xs text-black/60 font-medium">
            Review student leadership applications, shortlist talent, and promote campus ambassadors with auto-referral codes.
          </p>
        </div>

        <button
          onClick={loadApplications}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-black/15 text-xs font-bold text-black hover:border-black/30 hover:text-black active:scale-95 transition-all shadow-2xs whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {['pending', 'shortlisted', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              filter === f
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'bg-white border border-black/10 text-black/70 hover:text-black hover:border-black/20'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-black/40 space-y-3">
          <Loader2 size={32} className="animate-spin text-[#7C3AED]" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-16 p-8 rounded-[28px] bg-white border border-black/10 text-center space-y-2">
          <Award size={36} className="mx-auto text-black/20" />
          <h3 className="text-base font-bold text-black">No {filter !== 'all' ? filter : ''} applications</h3>
          <p className="text-xs text-black/50 max-w-sm mx-auto font-medium">
            When students submit ambassador applications, they will appear here for review and verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => {
            const isProcessing = processingId === app.id;
            return (
              <div
                key={app.id}
                className="p-6 sm:p-7 rounded-[28px] bg-white border border-black/10 shadow-xs hover:shadow-sm transition-all space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black/5 text-black border border-black/10 flex items-center justify-center font-black text-lg flex-shrink-0">
                      {app.full_name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-black">{app.full_name}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-black/60 font-medium mt-0.5">
                        <span className="flex items-center gap-1">
                          <Building2 size={13} className="text-black/60" />
                          {app.college_name || 'Campus Not Specified'}
                        </span>
                        <span>•</span>
                        <span>{app.branch || 'Branch N/A'}</span>
                        <span>•</span>
                        <span>{app.year || 'Year N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-black/50 font-medium sm:text-right">
                    Applied: {new Date(app.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="space-y-2 bg-[#FAFAF8] p-4 rounded-2xl border border-black/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">Contact &amp; Profiles</span>
                    <div className="flex items-center gap-2 text-black pt-1">
                      <Mail size={14} className="text-black/60 flex-shrink-0" />
                      <a href={`mailto:${app.email}`} className="hover:underline truncate">{app.email}</a>
                    </div>
                    {app.phone && (
                      <div className="flex items-center gap-2 text-black">
                        <Phone size={14} className="text-black/60 flex-shrink-0" />
                        <span>{app.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-1">
                      {app.instagram_handle && (
                        <div className="flex items-center gap-1.5 text-black">
                          <Instagram size={14} className="text-rose-600 flex-shrink-0" />
                          <span className="truncate">{app.instagram_handle}</span>
                        </div>
                      )}
                      {app.linkedin_url && (
                        <a
                          href={app.linkedin_url.startsWith('http') ? app.linkedin_url : `https://${app.linkedin_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-black font-semibold hover:underline"
                        >
                          <Linkedin size={14} className="flex-shrink-0" />
                          <span>LinkedIn</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#FAFAF8] p-4 rounded-2xl border border-black/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">Why Meova Statement</span>
                    <p className="text-black/80 leading-relaxed line-clamp-4 italic">
                      &ldquo;{app.why_ambassador}&rdquo;
                    </p>
                    {Array.isArray(app.meeting_locations) && app.meeting_locations.length > 0 && (
                      <div className="pt-2 border-t border-black/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 flex items-center gap-1">
                          <MapPin size={11} className="text-black/60" /> Recommended Spots:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {app.meeting_locations.map((loc, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-lg bg-white border border-black/10 text-[11px] text-black/70">
                              {loc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  {app.status === 'pending' && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(app.id, 'shortlist')}
                      className="px-4 py-2.5 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917] hover:bg-black/5 text-xs font-bold active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      Shortlist
                    </button>
                  )}

                  {app.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(app.id, 'approve')}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] shadow-xs active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                      <span>Approve Ambassador</span>
                    </button>
                  )}

                  {app.status !== 'rejected' && app.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(app.id, 'reject')}
                      className="px-4 py-2.5 rounded-full bg-white border border-black/15 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}

                  {app.status === 'approved' && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(app.id, 'revoke')}
                      className="px-4 py-2.5 rounded-full bg-white border border-black/15 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      Revoke Ambassador Role
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
