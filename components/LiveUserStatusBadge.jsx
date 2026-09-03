'use client';

import React from 'react';
import { useUserContext } from './providers/UserProvider';

export default function LiveUserStatusBadge({ userId, className = '' }) {
  const { isUserOnline } = useUserContext();

  if (!userId || !isUserOnline(userId)) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>Active Now</span>
    </span>
  );
}
