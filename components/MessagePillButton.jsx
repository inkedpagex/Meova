'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageDotsIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

/**
 * MessagePillButton — High-contrast rounded pill action button matching exact reference:
 * - Pure white background (#FFFFFF) with subtle hairline border and elevation
 * - Vibrant purple speech bubble icon with 2 dots (#7657D9)
 * - Deep pitch black bold Inter typography
 * - Generous inset padding so the icon never clips or touches the curved edge
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
      className={`meova-message-pill inline-flex items-center rounded-full font-bold select-none cursor-pointer whitespace-nowrap flex-shrink-0 active:scale-95 transition-all ${
        isSmall
          ? 'pl-3.5 pr-3.5 py-1 text-[11.5px] gap-1.5'
          : 'pl-4 pr-4 py-1.5 text-[12px] gap-2'
      } ${className}`.trim()}
    >
      <MessageDotsIcon
        size={isSmall ? 14 : 15}
        className="text-[#7657D9] flex-shrink-0"
      />
      <span className="leading-none font-bold tracking-tight">Message</span>
    </button>
  );
}
