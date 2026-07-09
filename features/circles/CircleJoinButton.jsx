'use client';

import React, { useState } from 'react';
import { joinCircle, leaveCircle } from './circles.api';
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
        await leaveCircle(circleId, userId);
        setIsMember(false);
      } else {
        await joinCircle(circleId, userId);
        setIsMember(true);
      }
      router.refresh();
    } catch (err) {
      console.error('Join/Leave failed:', err);
      alert('Failed to update membership. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleJoin}
      disabled={loading}
      className="w-full relative overflow-hidden text-[10px] font-black uppercase tracking-[0.1em] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-60"
      style={
        isMember
          ? {
              background: 'transparent',
              color,
              border: `1px solid ${color}40`,
            }
          : {
              background: `${color}18`,
              color,
              border: `1px solid ${color}35`,
            }
      }
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : isMember ? (
        <><Check size={13} strokeWidth={3} /> Joined</>
      ) : (
        <><Plus size={13} strokeWidth={2.5} /> Join</>
      )}
    </button>
  );
}
