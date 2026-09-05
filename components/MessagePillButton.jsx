'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from '@/lib/icons';
import { toast } from '@/lib/toast';

/**
 * MessagePillButton — Exact-styled rounded pill button:
 * - Pure white background with hairline border & subtle elevation
 * - Vibrant purple/violet icon with 2 dots (RemixIcon ri-chat-3-line / MessageSquare)
 * - Bold black typography in Inter
 * - Tactile active scale & zero text wrapping for mobile responsiveness
 */
export default function MessagePillButton({
  targetUserId,
  targetName = '',
  currentUserId = null,
  size = 'md',
  className = '',
}) {
  const router = useRouter();

  // Do not show button for self or if no target user exists
  if (!targetUserId || (currentUserId && targetUserId === currentUserId)) {
    return null;
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      toast.error('Please sign in to message this student');
      router.push('/login');
      return;
    }

    router.push(`/messages?uid=${targetUserId}`);
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Message ${targetName || 'user'}`}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white border border-black/10 text-black font-bold shadow-xs hover:shadow-sm hover:border-purple-300 hover:bg-purple-50/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 select-none ${
        isSmall
          ? 'px-3 py-1 text-[11.5px]'
          : 'px-3.5 py-1.5 text-[12px]'
      } ${className}`.trim()}
    >
      <MessageSquare
        size={isSmall ? 14 : 15}
        className="text-[#7C3AED] flex-shrink-0"
      />
      <span className="leading-none text-black">Message</span>
    </button>
  );
}
