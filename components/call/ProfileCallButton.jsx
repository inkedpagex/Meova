'use client';

import React from 'react';
import { Phone } from 'lucide-react';
import { useVoiceCall } from '@/components/providers/VoiceCallProvider';

export default function ProfileCallButton({ targetUserId, targetName, targetPhoto, bookingId, location }) {
  const { startCall } = useVoiceCall();

  return (
    <button
      type="button"
      onClick={() => {
        startCall({
          targetUserId,
          targetName: targetName || 'Campus Student',
          targetPhoto: targetPhoto || '',
          bookingId,
          location: location || 'Campus Meetup',
        });
      }}
      className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
      title="Call Campus Meetup Peer (100% Private & Free)"
    >
      <Phone size={15} />
      <span>Call Peer</span>
    </button>
  );
}
