'use client';

import { useState } from 'react';
import { Zap, Coffee, X, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COFFEE_COST = 50;

export default function BookCoffeeButton({ targetUserId, targetName, isLoggedIn, accentColor }) {
  const color = accentColor || '#ffffff';
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setOpen(true);
  }

  async function handleConfirm() {
    setLoading(true);
    // Simulate booking (in production this would call an API to deduct Sparks & create a booking)
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setBooked(true);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 hover:opacity-90 uppercase tracking-wide"
        style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
      >
        <Coffee className="w-3.5 h-3.5" />
        Book Coffee · {COFFEE_COST} ⚡
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl p-6 anim-scale-in"
            style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            {!booked && !loading && (
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-600 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {booked ? (
              // ── Success state ──
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">Coffee Booked!</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  Your request has been sent to <strong className="text-white">{targetName}</strong>. 50 Sparks have been deducted from your wallet. You'll get a confirmation soon!
                </p>
                <button
                  onClick={() => { setOpen(false); setBooked(false); }}
                  className="w-full py-3 rounded-xl text-xs font-black text-black bg-white active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              // ── Confirm state ──
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Coffee className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Book a Coffee Chat</h3>
                    <p className="text-[11px] text-neutral-500">with {targetName}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="rounded-2xl p-4 mb-5 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    { label: 'Session type', value: '1-on-1 Coffee Chat' },
                    { label: 'Duration', value: '30 minutes' },
                    { label: 'Location', value: 'Campus Café (to be confirmed)' },
                    { label: 'Scheduling', value: 'Flexible — they will reach out' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider flex-shrink-0">{label}</span>
                      <span className="text-[11px] font-semibold text-neutral-300 text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Cost */}
                <div className="flex items-center justify-between p-4 rounded-2xl mb-5" style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.1)' }}>
                  <span className="text-xs font-bold text-neutral-400">Booking cost</span>
                  <span className="flex items-center gap-1.5 text-sm font-black text-yellow-400">
                    <Zap className="w-4 h-4" />
                    {COFFEE_COST} Sparks
                  </span>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: `${color}`, color: '#000' }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
                  ) : (
                    <><Coffee className="w-4 h-4" /> Confirm &amp; Spend {COFFEE_COST} ⚡</>
                  )}
                </button>

                <p className="text-[10px] text-neutral-600 text-center mt-3">
                  Sparks will be deducted from your wallet immediately.{' '}
                  <Link href="/wallet" className="text-neutral-500 hover:text-white underline">Check balance</Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
