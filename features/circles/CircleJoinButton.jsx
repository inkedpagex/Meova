'use client';

import React, { useState } from 'react';
import { joinCircleAction, leaveCircleAction } from './circles.actions';
import { Plus, Check, Loader2 } from '@/lib/icons';
import { useRouter } from 'next/navigation';

export default function CircleJoinButton({ circleId, userId, isInitialMember, accentColor }) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(isInitialMember);
  const [loading, setLoading] = useState(false);
  const color = accentColor || '#ffffff';

  const handleToggleJoin = async () => {
    if (!userId) {
      router.push('/login');
      return;
    }

    const previousState = isMember;
    // 0ms Optimistic UI update
    setIsMember(!previousState);

    try {
      if (previousState) {
        const res = await leaveCircleAction(circleId);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await joinCircleAction(circleId);
        if (!res.success) throw new Error(res.error);
      }
      router.refresh();
    } catch (err) {
      // Revert if server rejects
      setIsMember(previousState);
      console.error('Join/Leave failed:', err);
    }
  };

  return (
    <button
      onClick={handleToggleJoin}
      className={`w-full relative overflow-hidden text-[13px] font-bold py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
        isMember
          ? "bg-transparent text-white border border-white/30 hover:border-white/50"
          : "bg-[var(--accent)] text-white border border-[var(--accent)] hover:bg-[var(--accent-hover)]"
      }`}
    >
      {isMember ? <>Joined</> : <>Join</>}
    </button>
  );
}
