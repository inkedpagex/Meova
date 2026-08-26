"use client";

import React, { useState } from 'react';
import { CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useRouter } from 'next/navigation';

export default function AcceptBookingButton({ booking, className = "" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, action: 'accept' })
      });
      const data = await res.json();
      if (data.success || data.ok) {
        toast.success(`Booking accepted! 🎉`);
        router.refresh();
        router.push('/bookings');
      } else {
        toast.error(data.error || 'Failed to accept booking');
      }
    } catch (err) {
      toast.error('Network error while accepting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className={`bg-emerald-500 text-white font-black rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:bg-emerald-600 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <CheckCircle2 size={16} />
      )}
      Accept Meeting
    </button>
  );
}
