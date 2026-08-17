'use client';

import { useState, useEffect } from 'react';
import { Zap, Layers, X, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COFFEE_COST = 50;

export default function BookCoffeeButton({ targetUserId, targetName, isLoggedIn, accentColor }) {
  const color = accentColor || '#ffffff';
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (open && isLoggedIn) {
      setLoadingWallet(true);
      setError('');
      fetch('/api/wallet')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load wallet');
          return res.json();
        })
        .then((data) => {
          if (data.wallet) {
            setWallet(data.wallet);
          } else {
            setError('Could not retrieve wallet balance.');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Could not load wallet balance.');
        })
        .finally(() => {
          setLoadingWallet(false);
        });
    }
  }, [open, isLoggedIn]);

  function handleClick() {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setOpen(true);
  }

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: `cabin_${targetUserId}`,
          title: 'Reserve Workspace Cabin',
          price: COFFEE_COST,
          duration: 60,
          location: 'Workspace Cabin Slot',
          category: 'Study',
          hostId: targetUserId,
          hostName: targetName,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          time: 'Flexible slot'
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete booking request.');
      }
      setBooked(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const spendableSparks = wallet ? (wallet.purchased || 0) + (wallet.bonus || 0) : 0;
  const hasEnoughSparks = spendableSparks >= COFFEE_COST;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 hover:opacity-90 uppercase tracking-wide cursor-pointer shadow-md"
        style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
      >
        <Layers className="w-3.5 h-3.5" />
        Reserve Cabin · {COFFEE_COST} ⚡
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
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            {!booked && !loading && (
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]"
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
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Cabin Spot Reserved!</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 font-semibold">
                  Your reservation request has been sent to <strong className="text-[var(--text-primary)]">{targetName}</strong>. {COFFEE_COST} Sparks have been deducted from your wallet. You'll receive a slot confirmation in dynamic alerts soon!
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    setBooked(false);
                    router.refresh();
                  }}
                  className="w-full py-3 rounded-xl text-xs font-black text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              // ── Confirm state ──
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Layers className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-primary)]">Reserve Study Spot</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] font-semibold">with {targetName}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="rounded-2xl p-4 mb-4 space-y-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  {[
                    { label: 'Space Cabin', value: 'Private Study Cabin / Workspace' },
                    { label: 'Duration', value: '1-Hour Session' },
                    { label: 'Location', value: 'Shared Workspace Spot (confirmed on approval)' },
                    { label: 'Amenities', value: 'Power sockets, High-speed Wi-Fi, Coffee' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider flex-shrink-0">{label}</span>
                      <span className="text-[11px] font-bold text-[var(--text-secondary)] text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Balance & Cost Info */}
                <div className="space-y-2 mb-4">
                  {/* Cost */}
                  <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                    <span className="text-xs font-bold text-[#92400e]">Booking cost</span>
                    <span className="flex items-center gap-1.5 text-sm font-black text-[#d97706]">
                      <Zap className="w-4 h-4 fill-current" />
                      {COFFEE_COST} Sparks
                    </span>
                  </div>

                  {/* Wallet Balance */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)]">Your Balance</span>
                    {loadingWallet ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <span className="text-xs font-black text-[var(--text-primary)]">
                        {spendableSparks} Sparks
                      </span>
                    )}
                  </div>
                </div>

                {/* Errors & Low Balance Alert */}
                {error && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold text-center">
                    {error}
                  </div>
                )}

                {wallet && !hasEnoughSparks && !loadingWallet ? (
                  <div className="flex flex-col gap-3 mt-4">
                    <div className="p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)', border: '1px solid #fecdd3' }}>
                      <Zap className="w-8 h-8 text-rose-500 fill-rose-500 mb-1 drop-shadow-sm" />
                      <h4 className="text-sm font-black text-rose-600 uppercase tracking-widest">Out of Sparks</h4>
                      <p className="text-[11px] font-bold text-rose-500/80 leading-relaxed px-4">
                        You are short <strong className="text-rose-600">{COFFEE_COST - spendableSparks} Sparks</strong>. Recharge your wallet to continue connecting!
                      </p>
                    </div>
                    <Link
                      href="/wallet/buy"
                      className="w-full py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md bg-rose-500 hover:bg-rose-600 text-white"
                    >
                      Buy Sparks Now ⚡
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirm}
                    disabled={loading || loadingWallet || !wallet}
                    className="w-full py-3.5 mt-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:cursor-not-allowed cursor-pointer shadow-md"
                    style={{ background: color, color: '#ffffff', border: 'none' }}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
                    ) : (
                      <><Layers className="w-4 h-4" /> Confirm &amp; Spend {COFFEE_COST} ⚡</>
                    )}
                  </button>
                )}

                <p className="text-[10px] text-[var(--text-muted)] text-center mt-3 font-semibold">
                  Sparks will be deducted from your wallet immediately.{' '}
                  <Link href="/wallet" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Check balance</Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
