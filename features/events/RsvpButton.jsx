'use client';

import React, { useState } from 'react';
import { rsvpToEvent, cancelRsvp } from './events.api';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RsvpButton({ eventId, userId, isInitialRsvp }) {
  const router = useRouter();
  const [isRsvp, setIsRsvp] = useState(isInitialRsvp);
  const [loading, setLoading] = useState(false);

  const handleRsvp = async () => {
    if (!userId) { router.push('/login'); return; }
    setLoading(true);
    try {
      if (isRsvp) { await cancelRsvp(eventId, userId); setIsRsvp(false); }
      else        { await rsvpToEvent(eventId, userId); setIsRsvp(true); }
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRsvp}
      disabled={loading}
      className={`
        text-[11px] font-bold tracking-wide px-4 py-1.5 rounded-full
        transition-all duration-200 active:scale-95 disabled:opacity-50
        border
        ${isRsvp
          ? 'border-[#333] text-[#888] hover:border-[#555] hover:text-white bg-transparent'
          : 'border-white text-white hover:bg-white hover:text-black bg-transparent'
        }
      `}
    >
      {loading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : isRsvp ? (
        'Going ✓'
      ) : (
        'RSVP'
      )}
    </button>
  );
}
