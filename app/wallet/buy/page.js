'use client';

import { useState, useEffect } from 'react';
import { Zap, CheckCircle, Copy, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SlideButton } from '@/components/ui/slide-button';

const PACKS = [
  { key: 'starter', sparks: 100,  inr: 49,  label: 'Starter',  popular: false, bonus: 0 },
  { key: 'popular', sparks: 250,  inr: 99,  label: 'Popular',  popular: true,  bonus: 10 },
  { key: 'growth',  sparks: 700,  inr: 249, label: 'Growth',   popular: false, bonus: 50 },
  { key: 'pro',     sparks: 1600, inr: 499, label: 'Pro',      popular: false, bonus: 150 },
];

const ADMIN_UPI = 'chirag2006chak-1@okicici';

export default function BuyPage() {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState('select'); // 'select' | 'pay' | 'done'
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => setUserId(d?.user?.id || d?.user?.uid || null))
      .catch(() => {});
  }, []);

  const qrData = selected ? `upi://pay?pa=${ADMIN_UPI}&pn=Meetuply&am=${selected.inr.toFixed(2)}&tn=${refCode}&cu=INR` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  async function handleProceed() {
    if (!selected) return;
    setLoading(true);
    try {
      // Generate reference code server-side (or fallback client-side)
      let code = '';
      try {
        const res = await fetch('/api/wallet/request-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packKey: selected.key }),
        });
        const data = await res.json().catch(() => ({}));
        code = data.reference_code || '';
      } catch (e) {}

      // Fallback: generate code client-side
      if (!code) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      }

      setRefCode(code);
      setStep('pay');
    } catch (err) {
      console.warn('Proceed failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSlideSuccess() {
    // Payment request is already created server-side in handleProceed.
    // Dispatch event so wallet page can refresh if needed.
    if (selected && userId) {
      window.dispatchEvent(new Event('wallet-updated'));
    }
    setStep('done');
  }

  function copyCode() {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-[480px] mx-auto anim-fade-in relative px-4 pb-12">
      {/* Background ambient glows */}
      <div className="absolute top-[-50px] left-1/3 w-80 h-80 bg-[#9e4685]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {step !== 'done' && (
        <Link href="/wallet" className="inline-flex items-center gap-2 text-xs font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all mb-8 uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Wallet
        </Link>
      )}

      {/* STEP 1: Select Pack */}
      {step === 'select' && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              Buy Sparks ⚡
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed font-semibold">
              Power up your student profile! Select a Sparks package to load campus tokens into your wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {PACKS.map(pack => {
              const isSelected = selected?.key === pack.key;
              return (
                <button
                  key={pack.key}
                  onClick={() => setSelected(pack)}
                  className={`group relative text-left p-5 rounded-2xl transition-all duration-300 active:scale-95 border cursor-pointer shadow-sm ${
                    isSelected 
                      ? 'bg-[var(--bg-hover)] border-[var(--accent)]' 
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-mid)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-[var(--bg-base)] text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                      Popular
                    </span>
                  )}
                  
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                      {pack.sparks.toLocaleString()}
                    </span>
                    <span className="text-yellow-400 text-sm">⚡</span>
                  </div>

                  {pack.bonus > 0 && (
                    <p className="text-[10px] text-[#b5609d] font-black mb-3">
                      + {pack.bonus} Bonus ⚡
                    </p>
                  )}
                  
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold mb-1">{pack.label} Pack</p>
                  <p className="text-base font-black text-[var(--text-primary)]">₹{pack.inr}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            {selected ? (
              <button
                onClick={handleProceed}
                disabled={loading}
                className="btn btn-primary w-full justify-center py-3.5 text-xs font-black shadow-lg flex items-center gap-2 group transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Payment Details...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay ₹{selected.inr}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 text-xs font-bold rounded-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-center cursor-not-allowed shadow-inner"
              >
                Select a pack to proceed
              </button>
            )}
          </div>
        </>
      )}

      {/* STEP 2: Pay QR Code and Confirm */}
      {step === 'pay' && selected && (
        <div className="text-center anim-scale-in">
          <div className="mb-6">
            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight mb-2">
              Scan QR & Pay
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed font-semibold">
              Open any UPI app (GPay, PhonePe, Paytm), scan the QR code below, and pay <strong className="text-[var(--text-primary)]">₹{selected.inr}</strong>.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="relative overflow-hidden mx-auto w-52 h-52 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center p-3 mb-6 shadow-2xl">
            <img src={qrCodeUrl} alt="Scan to pay" className="w-full h-full rounded-lg" />
          </div>

          <div className="space-y-1.5 mb-6 text-xs text-[var(--text-secondary)] font-bold">
            <p>UPI ID: <strong className="text-[var(--text-primary)] font-black">{ADMIN_UPI}</strong></p>
            <p>Amount: <strong className="text-[var(--text-primary)] font-black">₹{selected.inr}</strong></p>
          </div>

          {/* Reference code copy widget */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-left mb-6 relative overflow-hidden shadow-sm">
            <p className="text-[9px] font-black text-amber-500 tracking-wider uppercase mb-2">
              ⚠️ Add this reference code in UPI payment note/remarks
            </p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm font-mono font-black text-[var(--text-primary)] tracking-widest">
                {refCode}
              </code>
              <button 
                onClick={copyCode} 
                className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-90"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-left mb-8 space-y-3 shadow-sm">
            <h4 className="text-[10px] font-black text-[var(--text-muted)] tracking-wider uppercase">Instructions</h4>
            {[
              `Scan and pay ₹${selected.inr} to ${ADMIN_UPI}`,
              `Copy and paste the reference code "${refCode}" in the remarks note`,
              `Slide the button below once payment is successfully submitted!`
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[9px] font-black text-[var(--text-secondary)] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-normal font-semibold">{text}</p>
              </div>
            ))}
          </div>

          {/* Slider confirmation */}
          <div className="space-y-4">
            <SlideButton 
              onSuccess={handleSlideSuccess}
              label="Slide to Confirm Payment"
            />
            <button 
              onClick={() => setStep('select')} 
              className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all uppercase tracking-wider block mx-auto"
            >
              Change Package / Go Back
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment Success / Verification Confirmation */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center text-center py-10 anim-scale-in max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 shadow-2xl animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-3">
            Payment Confirmed!
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-8 font-semibold">
            We have registered your request with reference code <strong className="text-[var(--text-primary)] font-mono">{refCode}</strong>. Your Sparks will be credited to your wallet in a few minutes after admin verification.
          </p>
          <Link 
            href="/wallet" 
            className="btn btn-primary w-full justify-center py-3.5 text-xs font-black shadow-lg active:scale-95"
          >
            Back to Wallet Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
