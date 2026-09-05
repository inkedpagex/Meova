'use client';

import React, { useState } from 'react';
import { Star, X, CheckCircle2, Loader2, Sparkles } from '@/lib/icons';
import { toast } from '../lib/toast';
import { getCartoonAvatar } from '../utils/avatar';

const QUICK_TAGS_MEETING = [
  'Punctual',
  'Friendly & Polite',
  'Great Conversation',
  'Super Helpful',
  'Knowledgeable',
  'Fun Vibe',
];

const QUICK_TAGS_GIG = [
  'Fast Delivery',
  'High Quality Work',
  'Clear Communication',
  'Skillful & Pro',
  'Highly Recommended',
  'Great Experience',
];

const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional & Awesome! 🔥',
};

export default function RatingReviewModal({
  isOpen,
  onClose,
  targetUserId,
  targetName = 'Peer',
  targetPhoto = '',
  contextType = 'meeting', // 'meeting' | 'gig'
  contextTitle = '',
  bookingId = null,
  gigId = null,
  onSuccess,
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const quickTags = contextType === 'gig' ? QUICK_TAGS_GIG : QUICK_TAGS_MEETING;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!targetUserId) {
      toast.error('Invalid recipient for review');
      return;
    }

    setSubmitting(true);
    try {
      const fullComment = [
        selectedTags.length > 0 ? selectedTags.join(' · ') : '',
        comment.trim(),
      ]
        .filter(Boolean)
        .join('\n\n');

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          bookingId: bookingId || (contextType === 'meeting' ? `meeting_${Date.now()}` : undefined),
          gigId: gigId || (contextType === 'gig' ? `gig_${Date.now()}` : undefined),
          rating,
          comment: fullComment || 'Great experience!',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit review');
        return;
      }

      setSubmitted(true);
      toast.success('Thank you for rating!');

      // Store in localStorage as well to immediately reflect on the UI
      try {
        if (bookingId) localStorage.setItem(`reviewed_booking_${bookingId}`, String(rating));
        if (gigId) localStorage.setItem(`reviewed_gig_${gigId}`, String(rating));
      } catch {}

      if (onSuccess) onSuccess({ rating, comment: fullComment });

      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setComment('');
        setSelectedTags([]);
      }, 1500);
    } catch (err) {
      console.error('Review submit error:', err);
      toast.error('Network error while submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] w-full max-w-[390px] overflow-hidden shadow-[0_4px_16px_rgba(28,25,23,0.08)] anim-scale-in border border-[#E7E5E4] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FAFAF8]/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
              {contextType === 'gig' ? 'Rate & Review Gig' : 'Rate Your Meeting'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] transition-colors cursor-pointer"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center animate-bounce shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-base font-bold text-[#1C1917]">Rating Submitted!</h4>
            <p className="text-xs text-[#78716C] font-medium max-w-[260px]">
              Your feedback helps keep the Meova campus community trustworthy and awesome.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Target User Info */}
            <div className="flex items-center gap-3 bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] p-3 rounded-[16px]">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-[var(--accent-tint-20)] shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
                <img
                  src={targetPhoto || getCartoonAvatar(targetName || 'peer')}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getCartoonAvatar(targetName || 'peer');
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  {contextType === 'gig' ? 'Freelancer / Client' : 'Meeting Partner'}
                </p>
                <h4 className="text-[14px] font-bold text-[#1C1917] truncate">{targetName}</h4>
                {contextTitle && (
                  <p className="text-[12px] font-medium text-[#78716C] truncate mt-0.5">
                    {contextTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Interactive 5-Star Rating */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= activeRating
                          ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'
                          : 'text-[#2A2A2A] fill-[#141414]'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-[#1C1917] mt-2 tracking-tight">
                {RATING_LABELS[activeRating] || 'Rate your experience'}
              </p>
            </div>

            {/* Quick Feedback Tags */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
                What went well?
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-[0_2px_8px_rgba(28,25,23,0.06)]'
                          : 'bg-[#FAFAF8] hover:bg-[var(--accent-tint-10)] text-[#1C1917] border-[#E7E5E4]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a quick review or appreciation note (optional)..."
                rows={3}
                className="w-full text-xs font-medium p-3 rounded-[16px] bg-[#FAFAF8] border border-[#E7E5E4] text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Submit Rating ({rating} ★)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
