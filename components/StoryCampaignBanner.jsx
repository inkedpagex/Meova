'use client';

import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, Clock, X, Loader2, ChevronRight, Sparkles } from 'lucide-react';
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

export default function StoryCampaignBanner({ className = '' }) {
  const [data, setData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [handle, setHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaign = async () => {
    try {
      const res = await fetch('/api/campaigns/story');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
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
      {/* Clean, Compact Native Spotlight Card */}
      <div 
        onClick={() => !userClaim && setIsOpen(true)}
        className={`group bg-white border border-zinc-200/90 hover:border-orange-300/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${className}`}
      >
        {/* Left: Instagram Gradient Avatar Ring */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FCB045] via-[#FD1D1D] to-[#833AB4] flex-shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#FD1D1D]">
              <InstagramIcon size={18} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-zinc-900 truncate group-hover:text-[#F05A00] transition-colors">
                Tag @meova.in on Instagram Story
              </h4>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium truncate flex items-center gap-1 mt-0.5">
              <span>Get 100 free Sparks in your wallet</span>
              <span className="text-zinc-300">·</span>
              <span className="text-[#F05A00] font-bold">1 hr reward</span>
            </p>
          </div>
        </div>

        {/* Right: Compact Action Pill */}
        <div className="flex-shrink-0">
          {userClaim ? (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-700">
              {userClaim.status === 'approved' ? (
                <>
                  <CheckCircle size={13} className="text-emerald-500" />
                  <span className="text-emerald-700 font-black">+100 Claimed</span>
                </>
              ) : userClaim.status === 'pending' ? (
                <>
                  <Clock size={12} className="animate-spin text-amber-500" />
                  <span className="text-amber-700 font-bold">In Review</span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                  className="text-[#F05A00] font-black underline cursor-pointer"
                >
                  Resubmit
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-zinc-950 hover:bg-[#F05A00] text-white text-xs font-black transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              <span>Claim</span>
              <Zap size={11} className="fill-amber-300 text-amber-300" />
            </button>
          )}
        </div>
      </div>

      {/* Claim Submission Modal */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-[370px] overflow-hidden shadow-2xl relative cursor-default border border-zinc-100 anim-scale-in p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-[#FCB045] via-[#FD1D1D] to-[#833AB4]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#FD1D1D]">
                    <InstagramIcon size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Claim 100 Free Sparks</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Instagram Story Tag</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-orange-50/70 border border-orange-200/70 rounded-2xl p-3 mb-4 space-y-1">
              <p className="text-xs font-black text-orange-950 flex items-center gap-1">
                <Sparkles size={12} className="text-[#F05A00]" /> 3 Quick Steps:
              </p>
              <ol className="text-[11px] text-orange-900/90 font-medium space-y-1 list-decimal list-inside leading-relaxed">
                <li>Share a story on Instagram promoting Meova.</li>
                <li>Tag <strong>@meova.in</strong> in your story.</li>
                <li>Enter your Instagram handle below and tap submit.</li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-700 mb-1.5">
                  Your Instagram Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-sm">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="your_instagram_handle"
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#F05A00] focus:ring-1 focus:ring-[#F05A00] transition-all"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                  Zero upload friction · We verify your story tag on Instagram directly!
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-2xl font-bold text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-2xl font-black text-xs text-white bg-[#F05A00] hover:bg-[#D94F00] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : 'Submit & Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
