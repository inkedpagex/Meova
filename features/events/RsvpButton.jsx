'use client';

import React, { useState } from 'react';
import { rsvpToEventAction, cancelRsvpAction } from './events.actions';
import { Loader2 } from '@/lib/icons';
import { useRouter } from 'next/navigation';

export default function RsvpButton({ eventId, userId, isInitialRsvp }) {
  const router = useRouter();
  const [isRsvp, setIsRsvp] = useState(isInitialRsvp);
  const [loading, setLoading] = useState(false);

  const handleRsvp = async () => {
    if (!userId) { router.push('/login'); return; }
    const previous = isRsvp;
    // 0ms Optimistic UI update
    setIsRsvp(!previous);

    try {
      if (previous) { 
        const res = await cancelRsvpAction(eventId);
        if (!res.success) throw new Error(res.error);
      } else { 
        const res = await rsvpToEventAction(eventId);
        if (!res.success) throw new Error(res.error);
      }
      router.refresh();
    } catch (e) {
      // Revert if error
      setIsRsvp(previous);
      console.error(e);
    }
  };

  return (
    <button
      onClick={handleRsvp}
      className={`
        text-[11px] font-bold tracking-wide px-4 py-1.5 rounded-full
        transition-all duration-200 active:scale-95 cursor-pointer
        border
        ${isRsvp
          ? 'border-[#333] text-[#888] hover:border-[#555] hover:text-white bg-transparent'
          : 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white bg-transparent'
        }
      `}
    >
      {isRsvp ? 'Going ✓' : 'RSVP'}
    </button>
  );
}
