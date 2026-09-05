'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, UserCheck } from '@/lib/icons';
import { toast } from 'react-hot-toast';

export default function GenderPromptModal({ user }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prompt if user is logged in, completed profile, but missing gender
    if (user && user.profileComplete !== false && !user.gender) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [user]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGender) {
      setError('Please select an option');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users/update-gender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: selectedGender }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Gender saved confidentially');
        setOpen(false);
        router.refresh();
      } else {
        setError(data.error || 'Failed to save. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white border border-[#E7E5E4]/90 rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-[#A8A29E] hover:text-[#78716C] hover:bg-[#FAFAF8] transition-colors cursor-pointer"
          title="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)]/80 text-[var(--accent)] flex items-center justify-center mx-auto shadow-2xs">
            <UserCheck size={24} className="text-[var(--accent)]" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
            Quick Profile Update
          </h2>
          <p className="text-xs font-semibold text-[#78716C] max-w-xs mx-auto leading-relaxed">
            Please select your gender to complete your identity record.
          </p>
        </div>

        {/* Privacy Callout */}
        <div className="p-3.5 rounded-[14px] bg-[#FAFAF8] border border-[#E7E5E4]/80 flex items-start gap-3">
          <ShieldCheck size={18} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold text-[#78716C] leading-tight">
            Your gender remains strictly private. It will <strong className="text-[#1C1917]">NEVER</strong> be displayed on your public profile, cards, or shared with other users.
          </p>
        </div>

        {/* Form Selection */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'male', label: 'Male' },
              { id: 'female', label: 'Female' },
              { id: 'other', label: 'Other' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => { setSelectedGender(g.id); setError(''); }}
                className={`py-3.5 px-2 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer ${
                  selectedGender === g.id
                    ? 'border-[var(--accent)] bg-[var(--accent-tint-10)]/60 text-[var(--accent)] shadow-xs scale-[1.02]'
                    : 'border-[#E7E5E4] bg-white text-[#78716C] hover:border-[#E7E5E4]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!selectedGender || loading}
            className="w-full py-4 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save & Continue</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
