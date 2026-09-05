'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Loader2 } from '@/lib/icons';
import { toast } from '../../lib/toast';
import { useUserContext } from '../../components/providers/UserProvider';

export default function MessageButton({ targetUid }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useUserContext();

  const handleMessage = async () => {
    if (!user) {
      toast.error('Please log in to send a message.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: targetUid }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 402) {
          toast.error(data.error || 'Insufficient Sparks to start a chat.');
        } else {
          toast.error(data.error || 'Failed to start chat.');
        }
        setLoading(false);
        return;
      }

      router.push(`/messages?uid=${targetUid}`);
    } catch (err) {
      toast.error('Network error. Try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMessage}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-xs font-bold text-black bg-white border border-black/10 hover:border-purple-300 hover:bg-purple-50/40 transition-all active:scale-95 shadow-xs hover:shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 text-[#7C3AED] flex-shrink-0 animate-spin" />
      ) : (
        <MessageSquare className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
      )}
      {loading ? 'Connecting...' : 'Message'}
    </button>
  );
}
