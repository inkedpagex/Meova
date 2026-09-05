'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, CheckCircle, Copy, ArrowLeft, Loader2, ArrowRight, AlertCircle, Clock, Check } from '@/lib/icons';
import Link from 'next/link';
import { SlideButton } from '@/components/ui/slide-button';
import { toast } from '@/lib/toast';

const PACKS = [
  { key: 'starter', sparks: 100,  inr: 100,  label: 'Starter',  popular: false, bonus: 0 },
  { key: 'popular', sparks: 250,  inr: 250,  label: 'Popular',  popular: true,  bonus: 0 },
  { key: 'growth',  sparks: 500,  inr: 500,  label: 'Growth',   popular: false, bonus: 0 },
  { key: 'pro',     sparks: 1000, inr: 1000, label: 'Pro (Max)', popular: false, bonus: 0 },
];

const ADMIN_UPI = 'chirag2006chak@oksbi';

export default function BuyPage() {
  const [selected, setSelected] = useState(PACKS[1]);
  const [step, setStep] = useState('select'); // 'select' | 'pay' | 'done'
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const timerRef = useRef(null);

  const payAmount = reservation ? Number(reservation.final_amount || reservation.amount_inr || selected.inr) : selected.inr;
  const refCode = reservation?.reference_code || `SPK-${selected.sparks}`;
  const qrData = `upi://pay?pa=${ADMIN_UPI}&pn=Meova&am=${payAmount.toFixed(2)}&tn=${refCode}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

  useEffect(() => {
    if (step !== 'pay' || !reservation) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const expMs = reservation.expires_at ? new Date(reservation.expires_at).getTime() : Date.now() + 300000;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        toast.error('Reservation window expired. Please create a new request.');
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [step, reservation]);

  async function handleProceed() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packKey: selected.key,
          sparks: selected.sparks,
          baseAmount: selected.inr,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reservation) {
        setReservation(data.reservation);
        setTimeLeft(data.reservation.seconds_remaining || 300);
        setStep('pay');
      } else if (data.activeReservation) {
        setReservation(data.activeReservation);
        setTimeLeft(data.activeReservation.seconds_remaining || 300);
        setStep('pay');
      } else {
        toast.error(data.error || 'Failed to allocate decimal reservation.');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSlideSuccess() {
    if (!reservation?.id) return;
    try {
      const res = await fetch('/api/wallet/reservation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: reservation.id }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event('wallet-updated'));
        setStep('done');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to claim payment.');
      }
    } catch {
      toast.error('Network error while claiming.');
    }
  }

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-[480px] mx-auto anim-fade-in relative px-4 pt-[68px] md:pt-6 pb-12">
      {step !== 'done' && (
        <Link href="/wallet" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all mb-6 uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Wallet
        </Link>
      )}

      {/* STEP 1: Select Pack (1:1 Ratio) */}
      {step === 'select' && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              Buy Sparks
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-semibold">
              Load Sparks tokens into your wallet (1 Spark = ₹1).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {PACKS.map(pack => {
              const isSelected = selected?.key === pack.key;
              return (
                <button
                  key={pack.key}
                  onClick={() => setSelected(pack)}
                  className={`group relative text-left p-5 rounded-[20px] transition-all duration-300 active:scale-95 border cursor-pointer shadow-xs ${
                    isSelected 
                      ? 'bg-[var(--accent-tint-10)] border-[var(--accent)] text-[var(--accent)]' 
                      : 'bg-white border-[#E7E5E4] hover:border-[var(--accent-tint-20)] text-[#1C1917]'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      Popular
                    </span>
                  )}
                  
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-bold tracking-tight">
                      {pack.sparks.toLocaleString()}
                    </span>
                    <Zap size={18} className="fill-[var(--accent)] text-[var(--accent)]" />
                  </div>
                  
                  <p className="text-[11px] text-[#78716C] font-bold mb-1">{pack.label} Pack</p>
                  <p className="text-lg font-bold text-[#1C1917]">₹{pack.inr}</p>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full py-4 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Proceeding...</span>
              </>
            ) : (
              <>
                <span>Proceed to Pay ₹{selected.inr}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </>
      )}

      {/* STEP 2: Pay QR Code & Decimal Countdown */}
      {step === 'pay' && selected && (
        <div className="text-center anim-scale-in">
          {/* 5-Min Timer Pill */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 ${
              timeLeft < 60 ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <Clock size={13} />
              <span>Expires in: {formatTimer(timeLeft)}</span>
            </span>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
              Scan & Pay Exact Amount
            </h2>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto mt-1 font-semibold">
              Open GPay, PhonePe, or Paytm and pay exact amount with paise:
            </p>
          </div>

          {/* Exact Paise Highlight */}
          <div className="rounded-[20px] border border-[var(--accent-tint-20)] bg-[var(--accent-tint-10)] p-4 text-center mb-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] flex items-center justify-center gap-1">
              <Zap size={12} className="fill-current" />
              <span>Exact Matching Amount</span>
            </p>
            <p className="text-3xl font-bold text-[#1C1917] my-0.5">
              ₹{payAmount.toFixed(2)}
            </p>
            <p className="text-[11px] font-bold text-[#1C1917]/70">
              Pay exact paise (.{reservation?.unique_decimal || '00'}) so your payment is automatically verified in seconds!
            </p>
          </div>

          {/* QR Code Container */}
          <div className="relative mx-auto w-52 h-52 rounded-[20px] bg-white border border-[#E7E5E4] flex items-center justify-center p-3 mb-4 shadow-sm">
            <img src={qrCodeUrl} alt="Scan to pay" className="w-full h-full object-contain" />
          </div>

          {/* Quick Copy Widgets */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText(ADMIN_UPI);
                setCopiedUpi(true);
                setTimeout(() => setCopiedUpi(false), 2000);
                toast.success('UPI ID copied');
              }}
              className="p-2.5 rounded-xl bg-white border border-[#E7E5E4] text-xs font-bold text-[#1C1917] hover:bg-[#FAFAF8] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {copiedUpi ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(refCode);
                setCopiedRef(true);
                setTimeout(() => setCopiedRef(false), 2000);
                toast.success('Ref code copied');
              }}
              className="p-2.5 rounded-xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent-tint-20)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedRef ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>Ref: {refCode}</span>
            </button>
          </div>

          {/* Slide confirmation */}
          <div className="space-y-4">
            <SlideButton 
              onSuccess={handleSlideSuccess}
              label="Slide to Confirm Payment"
            />
            <button 
              onClick={() => setStep('select')} 
              className="text-[11px] font-bold text-[#78716C] hover:text-[#1C1917] transition-all uppercase tracking-wider block mx-auto cursor-pointer"
            >
              Change Package / Go Back
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment Success / Verification Confirmation */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center text-center py-10 anim-scale-in max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5 shadow-xs">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight mb-2">
            Payment Claimed!
          </h2>
          <p className="text-xs text-[#78716C] leading-relaxed mb-6 font-semibold">
            Your claim for <strong className="text-[#1C1917]">₹{payAmount.toFixed(2)}</strong> ({selected.sparks} Sparks) with reference code <strong className="text-[#1C1917] font-mono">{refCode}</strong> is now in review. Sparks will be credited to your wallet in a few minutes.
          </p>
          <Link 
            href="/wallet" 
            className="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-xs flex items-center justify-center"
          >
            Back to Wallet Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
