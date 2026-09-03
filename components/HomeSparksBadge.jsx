'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap } from '@/lib/icons';

export default function HomeSparksBadge({ userId, initialSparks }) {
  const [sparks, setSparks] = useState(initialSparks || 0);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    const updateSparks = async () => {
      try {
        const res = await fetch('/api/wallet');
        if (res.ok) {
          const data = await res.json();
          if (data.wallet) {
            const w = data.wallet;
            setSparks((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
          }
        }
      } catch (err) {
        // ignore
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
      <span className="text-xs font-bold text-[var(--text-primary)]">{sparks.toLocaleString()}</span>
    </Link>
  );
}
