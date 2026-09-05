'use client';

import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, Clock, X, Loader2, Sparkles } from '@/lib/icons';
import { toast } from '../lib/toast';

function InstagramIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// In-memory module cache for instant zero-lag page/tab transitions
let memoryCampaignCache = null;

function getCachedClaimData() {
  if (memoryCampaignCache) return memoryCampaignCache;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('meova_story_campaign_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        memoryCampaignCache = parsed;
        return parsed;
      }
    } catch {}
  }
  return null;
}

export default function StoryCampaignBanner({ className = '' }) {
  const [data, setData] = useState(getCachedClaimData);
  const [isLoading, setIsLoading] = useState(!data);
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [handle, setHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaign = async () => {
    try {
      const res = await fetch('/api/campaigns/story');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        memoryCampaignCache = json;
        try {
          localStorage.setItem('meova_story_campaign_cache', JSON.stringify(json));
        } catch {}
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handle.trim()) {
      toast.error('Please enter your Instagram username / handle');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagram_handle: handle.trim() }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || 'Story claim submitted successfully!');
        setIsOpen(false);
        // Optimistically update cache to 'pending'
        const updated = { ...data, userClaim: { status: 'pending', instagram_handle: handle.trim() } };
        setData(updated);
        memoryCampaignCache = updated;
        try {
          localStorage.setItem('meova_story_campaign_cache', JSON.stringify(updated));
        } catch {}
        fetchCampaign();
      } else {
        toast.error(json.error || 'Failed to submit claim.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const userClaim = data?.userClaim;

  // Auto-hide completely once 100 claims are approved by admin
  if (data && data.remainingSlots <= 0 && (!userClaim || userClaim.status !== 'pending')) {
    return null;
  }

  return (
    <>
      {/* Clean, Minimal Native Spotlight Card */}
      {/* Clean, Minimal Native Spotlight Card */}
      <div 
        onClick={() => userClaim ? setIsDetailOpen(true) : setIsOpen(true)}
        className={`group bg-white border border-[#E7E5E4] hover:border-[var(--accent)] rounded-[16px] p-2.5 px-3.5 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-[0.99] ${className}`}
      >
        {/* Left: Clean Single-Tone Icon & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
            <InstagramIcon size={14} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-[12px] font-bold text-[#1C1917] truncate group-hover:text-[var(--accent)] transition-colors leading-tight">
                Tag @meova.in on your Story
              </h4>
            </div>
            <p className="text-[11px] text-[#78716C] font-medium truncate flex items-center gap-1 mt-0.5">
              <span>Earn 100 free Sparks</span>
              <span className="text-[#D6D3D1]">·</span>
              <span className="text-[var(--accent)] font-bold">1 hr reward</span>
            </p>
          </div>
        </div>

        {/* Right: Action / Status */}
        <div className="flex-shrink-0">
          {isLoading && !userClaim ? (
            <div className="w-20 h-7 rounded-full bg-black/5 animate-pulse" />
          ) : userClaim ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsDetailOpen(true); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-2xs cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0 ${
                userClaim.status === 'approved'
                  ? 'bg-emerald-50 border border-emerald-200/90 text-emerald-700 hover:bg-emerald-100/70 hover:border-emerald-300'
                  : userClaim.status === 'pending'
                  ? 'bg-amber-50 border border-amber-200/90 text-amber-700 hover:bg-amber-100/70 hover:border-amber-300'
                  : 'bg-rose-50 border border-rose-200/90 text-rose-700 hover:bg-rose-100/70 hover:border-rose-300'
              }`}
            >
              {userClaim.status === 'approved' ? (
                <>
                  <CheckCircle size={13} className="text-emerald-600 flex-shrink-0 animate-bounce" style={{ animationIterationCount: 2 }} />
                  <span>+100 Claimed</span>
                </>
              ) : userClaim.status === 'pending' ? (
                <>
                  <Clock size={12} className="animate-spin text-amber-600 flex-shrink-0" />
                  <span>In Review</span>
                </>
              ) : (
                <span className="underline">Resubmit</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold transition-all duration-200 shadow-[0_2px_10px_rgba(240,90,0,0.35)] hover:shadow-[0_4px_16px_rgba(240,90,0,0.5)] cursor-pointer hover:scale-105 active:scale-90 whitespace-nowrap flex-shrink-0 group-hover:scale-105"
            >
              <span>Claim</span>
              <Zap size={11} className="fill-white text-white flex-shrink-0 transition-transform group-hover:rotate-12" />
            </button>
          )}
        </div>
      </div>

      {/* Claim Submission Modal */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs anim-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] w-full max-w-[370px] overflow-hidden shadow-[0_4px_16px_rgba(28,25,23,0.08)] relative cursor-default border border-[#E7E5E4] anim-scale-in p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
                  <InstagramIcon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917]">Claim 100 Free Sparks</h3>
                  <p className="text-[10px] text-[#78716C] font-bold uppercase tracking-wider">Instagram Story Tag</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#78716C] font-medium leading-relaxed mb-4">
              Post a story tagging <strong className="text-[var(--accent)]">@meova.in</strong> with a link to your Meova profile, then enter your handle below to claim reward.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@your_instagram_handle"
                  className="w-full text-xs font-medium p-3 rounded-full bg-[#FAFAF8] border border-[#E7E5E4] text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-98 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex-shrink-0"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting Claim...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Submit & Claim 100 Sparks</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Claim Detail / Receipt Modal (Shown when clicking claimed/pending badge) */}
      {isDetailOpen && userClaim && (
        <div 
          onClick={() => setIsDetailOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs anim-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] w-full max-w-[370px] overflow-hidden shadow-[0_4px_24px_rgba(28,25,23,0.12)] relative cursor-default border border-[#E7E5E4] anim-scale-in p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#78716C]">Story Campaign Receipt</span>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Hero */}
            <div className="text-center py-2 mb-4">
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 shadow-sm ${
                userClaim.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                userClaim.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
                {userClaim.status === 'approved' ? (
                  <CheckCircle size={28} className="text-emerald-600" />
                ) : userClaim.status === 'pending' ? (
                  <Clock size={28} className="text-amber-600 animate-spin" />
                ) : (
                  <X size={28} className="text-rose-600" />
                )}
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">
                {userClaim.status === 'approved' ? '100 Sparks Credited!' :
                 userClaim.status === 'pending' ? 'Verification In Review' :
                 'Claim Rejected'}
              </h3>
              <p className="text-xs text-[#78716C] mt-1 font-medium">
                {userClaim.status === 'approved' ? 'Instagram story reward verified & deposited to your wallet.' :
                 userClaim.status === 'pending' ? 'Our team is reviewing your Instagram story tag.' :
                 userClaim.admin_note || 'Story tag could not be verified.'}
              </p>
            </div>

            {/* Receipt Details Box */}
            <div className="p-3.5 bg-[#FAFAF8] rounded-[20px] border border-[#E7E5E4] space-y-2.5 mb-5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#78716C] font-semibold">Instagram Handle</span>
                <span className="font-bold text-[#1C1917]">{userClaim.instagram_handle || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#78716C] font-semibold">Reward Amount</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span>+{userClaim.reward_sparks || 100} Sparks</span>
                  <Zap size={12} className="fill-emerald-600 inline-block" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#78716C] font-semibold">Status</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  userClaim.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  userClaim.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {userClaim.status === 'approved' ? 'Verified & Deposited' : userClaim.status}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDetailOpen(false)}
              className="w-full py-3 rounded-full bg-[#1C1917] hover:bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-98 transition-all whitespace-nowrap flex-shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
