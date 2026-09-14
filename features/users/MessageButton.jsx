'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageDotsIcon } from '@/lib/icons';
import { toast } from '../../lib/toast';
import { useUserContext } from '../../components/providers/UserProvider';

export default function MessageButton({ targetUid }) {
  const router = useRouter();
  const { user } = useUserContext();

  const handleMessage = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!user) {
      toast.error('Please log in to send a message.');
      router.push('/login');
      return;
    }

    // 0ms Instant Navigation: Immediately transition to chat interface
    router.push(`/messages?uid=${targetUid}`);

    // Pre-create/warm chat in background without blocking the user
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otherUserId: targetUid }),
    }).catch(() => {});
  };

  return (
    <button
      onClick={handleMessage}
      className="meova-message-pill flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer select-none"
    >
      <MessageDotsIcon size={16} className="text-[#7657D9] flex-shrink-0" />
      <span className="leading-none font-bold tracking-tight">Message</span>
    </button>
  );
}
