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
        onClick={() => !userClaim && setIsOpen(true)}
        className={`group bg-white border border-[#E7E5E4] hover:border-[#6D28D9] rounded-[16px] p-2.5 px-3.5 transition-all flex items-center justify-between gap-3 cursor-pointer select-none shadow-[0_2px_8px_rgba(28,25,23,0.06)] ${className}`}
      >
        {/* Left: Clean Single-Tone Icon & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#F3EEFC] border border-[#E4D9F7] text-[#6D28D9] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
            <InstagramIcon size={14} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-[12px] font-bold text-[#1C1917] truncate group-hover:text-[#6D28D9] transition-colors leading-tight">
                Tag @meova.in on your Story
              </h4>
            </div>
            <p className="text-[11px] text-[#78716C] font-medium truncate flex items-center gap-1 mt-0.5">
              <span>Earn 100 free Sparks</span>
              <span className="text-[#D6D3D1]">·</span>
              <span className="text-[#6D28D9] font-bold">1 hr reward</span>
            </p>
          </div>
        </div>

        {/* Right: Action / Status */}
        <div className="flex-shrink-0">
          {isLoading && !userClaim ? (
            <div className="w-20 h-7 rounded-full bg-black/5 animate-pulse" />
          ) : userClaim ? (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
              {userClaim.status === 'approved' ? (
                <>
                  <CheckCircle size={12} className="text-emerald-600 flex-shrink-0" />
                  <span>+100 Claimed</span>
                </>
              ) : userClaim.status === 'pending' ? (
                <>
                  <Clock size={11} className="animate-spin text-amber-600 flex-shrink-0" />
                  <span className="text-amber-700">In Review</span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                  className="text-[#6D28D9] font-bold underline cursor-pointer"
                >
                  Resubmit
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-[11px] font-bold transition-all shadow-[0_2px_8px_rgba(28,25,23,0.06)] cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <span>Claim</span>
              <Zap size={10} className="fill-white text-white flex-shrink-0" />
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
                <div className="w-8 h-8 rounded-full bg-[#F3EEFC] border border-[#E4D9F7] text-[#6D28D9] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
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
              Post a story tagging <strong className="text-[#6D28D9]">@meova.in</strong> with a link to your Meova profile, then enter your handle below to claim reward.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@your_instagram_handle"
                  className="w-full text-xs font-medium p-3 rounded-full bg-[#FAFAF8] border border-[#E7E5E4] text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-98 transition-all cursor-pointer disabled:opacity-50"
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
    </>
  );
}
