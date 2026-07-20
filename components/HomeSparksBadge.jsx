'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { mockDb } from '../lib/mockDatabase';

export default function HomeSparksBadge({ userId, initialSparks }) {
  const [sparks, setSparks] = useState(initialSparks || 0);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    const updateSparks = () => {
      const wallet = mockDb.getWallet(userId);
      if (wallet) {
        setSparks((wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0));
      }
    };

    updateSparks();

    window.addEventListener('wallet-updated', updateSparks);
    return () => {
      window.removeEventListener('wallet-updated', updateSparks);
    };
  }, [userId]);

  return (
    <Link href="/wallet" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-all">
      <Zap size={14} className="text-[#fb923c] fill-current" />
      <span className="text-xs font-black text-[var(--text-primary)]">{sparks.toLocaleString()}</span>
    </Link>
  );
}
