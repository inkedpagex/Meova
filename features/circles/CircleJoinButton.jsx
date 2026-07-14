'use client';

import React, { useState } from 'react';
import { joinCircleAction, leaveCircleAction } from './circles.actions';
import { Plus, Check, Loader2 } from 'lucide-react';
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

    setLoading(true);
    try {
      if (isMember) {
        const res = await leaveCircleAction(circleId);
        if (!res.success) throw new Error(res.error);
        setIsMember(false);
      } else {
        const res = await joinCircleAction(circleId);
        if (!res.success) throw new Error(res.error);
        setIsMember(true);
      }
      // router.refresh() is not strictly needed if actions revalidatePath, but it's safe to keep
      router.refresh();
    } catch (err) {
      console.error('Join/Leave failed:', err);
      alert(err.message || 'Failed to update membership. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleJoin}
      disabled={loading}
      className={`w-full relative overflow-hidden text-[13px] font-bold py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-60 ${
        isMember
          ? "bg-transparent text-white border border-white/30 hover:border-white/50"
          : "bg-white text-black border border-white hover:bg-neutral-200"
      }`}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : isMember ? (
        <>Joined</>
      ) : (
        <>Join</>
      )}
    </button>
  );
}
