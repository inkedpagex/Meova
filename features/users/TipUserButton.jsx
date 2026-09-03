'use client';
import React, { useState } from 'react';
import { Zap, Loader2 } from '@/lib/icons';
import { toast } from '../../lib/toast';
import { useUserContext } from '../../components/providers/UserProvider';

export default function TipUserButton({ targetUid, targetName }) {
  const [loading, setLoading] = useState(false);
  const { user } = useUserContext();

  const handleTip = async () => {
    if (!user) {
      toast.error('Please log in to tip.');
      return;
    }

    if (!confirm(`Are you sure you want to send 5 Sparks to ${targetName}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUid}/tip`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Failed to send tip.');
        setLoading(false);
        return;
      }

      toast.success(`Successfully tipped 5 Sparks to ${targetName}!`);
      
      // Update global spark balance if possible, or just dispatch event
      window.dispatchEvent(new Event('wallet-updated'));
    } catch (err) {
      toast.error('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTip}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-black text-white transition-all active:scale-95 shadow-md whitespace-nowrap cursor-pointer disabled:opacity-50"
      style={{ background: '#F05A00' }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
      ) : (
        <Zap className="w-4 h-4 flex-shrink-0 fill-current" />
      )}
      {loading ? 'Sending...' : 'Tip 5 Sparks'}
    </button>
  );
}
