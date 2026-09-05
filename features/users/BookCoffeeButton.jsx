'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Layers, X, CheckCircle, Loader2, Calendar, MapPin, Clock, Sparkles } from '@/lib/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateMeetupRate } from '../../lib/pricing';

export default function BookCoffeeButton({ targetUserId, targetName, targetPhoto, isLoggedIn, accentColor, rate, completedMeets, renderButton, buttonClassName, label }) {
  const meetsCount = typeof completedMeets === 'number'
    ? completedMeets
    : (typeof rate === 'number' && rate <= 25 ? rate : 0);
  const COFFEE_COST = calculateMeetupRate(meetsCount);
  const color = (accentColor && accentColor !== '#ffffff') ? accentColor : 'var(--accent)';
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('Tomorrow'); // 'Today' | 'Tomorrow' | 'Day After' | 'YYYY-MM-DD'
  const [customDate, setCustomDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('GD Subway');
  const [selectedTime, setSelectedTime] = useState('Noon (11 AM - 2 PM)');
  const [agenda, setAgenda] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!open || !isLoggedIn) return;
    let cancelled = false;
    (async () => {
      setLoadingWallet(true);
      setError('');
      try {
        const res = await fetch('/api/wallet');
        if (!res.ok) throw new Error('Failed to load wallet');
        const data = await res.json();
        if (cancelled) return;
        if (data.wallet) {
          setWallet(data.wallet);
        } else {
          setError('Could not retrieve wallet balance.');
        }
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError('Could not load wallet balance.');
      } finally {
        if (!cancelled) setLoadingWallet(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, isLoggedIn]);

  function handleClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setOpen(true);
  }

  async function handleConfirm() {
    setLoading(true);
    setError('');

    let finalDateStr = '';
    if (selectedDate === 'Today') {
      finalDateStr = new Date().toISOString().split('T')[0];
    } else if (selectedDate === 'Tomorrow') {
      finalDateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    } else if (selectedDate === 'Day After') {
      finalDateStr = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    } else if (customDate) {
      finalDateStr = customDate;
    } else {
      finalDateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: `meet_${targetUserId}`,
          title: 'Campus Meetup',
          price: COFFEE_COST,
          duration: 60,
          location: selectedLocation,
          category: 'Meetup',
          hostId: targetUserId,
          hostName: targetName,
          hostPhoto: targetPhoto || '',
          date: finalDateStr,
          time: selectedTime,
          agenda: agenda.trim(),
        }),
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
      {renderButton ? (
        renderButton({ onClick: handleClick })
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={buttonClassName || "w-full h-12 flex items-center justify-center gap-2 px-4 rounded-full text-[14px] font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all active:scale-95 uppercase tracking-wider cursor-pointer shadow-xs whitespace-nowrap"}
        >
          <Calendar size={16} className="text-white flex-shrink-0" />
          <span>{label || `Book Meet · ${COFFEE_COST} Sparks`}</span>
        </button>
      )}

      {/* Modal overlay */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 anim-fade-in"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden anim-scale-in max-h-[92dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-5 py-4 text-white relative flex-shrink-0 flex items-center justify-between"
              style={{ background: 'var(--accent)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-white/20 border-2 border-white/40 flex-shrink-0 shadow-sm flex items-center justify-center">
                  {targetPhoto ? (
                    <img src={targetPhoto} alt={targetName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-base">{targetName?.charAt(0) || 'C'}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Campus Meetup</h3>
                  <p className="text-[11px] text-[var(--accent-tint-10)] font-medium truncate max-w-[220px]">
                    with <strong className="text-white">{targetName}</strong>
                  </p>
                </div>
              </div>

              {!booked && !loading && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {booked ? (
              // ── Success state ──
              <div className="p-6 text-center space-y-4 overflow-y-auto">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">Meetup Requested!</h3>
                <p className="text-xs text-[#78716C] leading-relaxed font-medium">
                  Your meetup request has been sent to <strong className="text-[#1C1917]">{targetName}</strong>. <strong>{COFFEE_COST} Sparks</strong> are held in secure escrow. You will receive an alert as soon as they confirm!
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    setBooked(false);
                    router.refresh();
                  }}
                  className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-95 transition-all cursor-pointer"
                  style={{ background: 'var(--accent)' }}
                >
                  Done
                </button>
              </div>
            ) : (
              // ── Booking Configuration ──
              <div className="p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
                {/* Location Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={11} className="text-[var(--accent)]" /> Meeting Location
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {[
                      "GD Subway", "Library", "Gate No 1 Canteen", "KC Ground", "Ninand Ground",
                      "Block 1", "Block 2", "Block 3", "Block 4", "Block 5", "Block 6"
                    ].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setSelectedLocation(loc)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedLocation === loc
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                            : 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4] hover:border-[var(--accent-tint-20)]'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={11} className="text-[var(--accent)]" /> Meeting Day
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { label: "Today", value: "Today" },
                      { label: "Tomorrow", value: "Tomorrow" },
                      { label: "Day After", value: "Day After" },
                      { label: "Pick Date", value: "Custom" }
                    ].map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setSelectedDate(d.value)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedDate === d.value
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                            : 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4] hover:border-[var(--accent-tint-20)]'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {selectedDate === 'Custom' && (
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-full px-3 py-2 text-xs font-bold text-[#1C1917] focus:outline-none focus:border-[var(--accent)] mt-1"
                    />
                  )}
                </div>

                {/* Time Slot */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-1">
                    <Clock size={11} className="text-[var(--accent)]" /> Preferred Time
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { label: "Morning (8-11)", value: "Morning (8 AM - 11 AM)" },
                      { label: "Noon (11-2)", value: "Noon (11 AM - 2 PM)" },
                      { label: "Afternoon (2-5)", value: "Afternoon (2 PM - 5 PM)" },
                      { label: "Evening (5-6)", value: "Evening (5 PM - 6 PM)" }
                    ].map((time) => (
                      <button
                        key={time.value}
                        type="button"
                        onClick={() => setSelectedTime(time.value)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedTime === time.value
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                            : 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4] hover:border-[var(--accent-tint-20)]'
                        }`}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agenda */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider block">
                    Meeting Purpose (Optional)
                  </label>
                  <textarea
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    placeholder="e.g. Discuss startup ideas, exam notes, campus project..."
                    className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-full px-3.5 py-2.5 text-xs font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    rows={2}
                  />
                </div>

                {/* Cost & Balance Summary */}
                <div className="rounded-2xl bg-[var(--accent-tint-10)]/70 border border-[var(--accent-tint-20)] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#78716C]">Booking Cost</span>
                    <span className="font-bold text-[var(--accent)] flex items-center gap-1">
                      <Zap size={13} className="fill-[var(--accent)]" /> {COFFEE_COST} Sparks
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--accent-tint-20)]">
                    <span className="font-medium text-[#78716C]">Your Wallet Balance</span>
                    {loadingWallet ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                    ) : (
                      <span className="font-bold text-[#1C1917]">
                        {spendableSparks} Sparks
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold text-center">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                {wallet && !hasEnoughSparks && !loadingWallet ? (
                  <div className="space-y-2 pt-1">
                    <div className="p-3 rounded-full bg-rose-50 border border-rose-100 text-center">
                      <p className="text-[11px] font-bold text-rose-600">
                        Short by {COFFEE_COST - spendableSparks} Sparks
                      </p>
                    </div>
                    <Link
                      href="/wallet/buy"
                      className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md bg-rose-500 hover:bg-rose-600 text-white"
                    >
                      <span>Buy Sparks</span>
                      <Zap size={13} className="fill-current" />
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirm}
                    disabled={loading || loadingWallet || !wallet}
                    className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
                    ) : (
                      <><Layers className="w-3.5 h-3.5" /> Confirm &amp; Spend {COFFEE_COST} Sparks</>
                    )}
                  </button>
                )}

                <p className="text-[10px] text-[#A8A29E] text-center font-medium">
                  Sparks will be held in escrow until meetup is completed.
                </p>
              </div>
            )}
          </div>
        </div>
      , document.body)}
    </>
  );
}
