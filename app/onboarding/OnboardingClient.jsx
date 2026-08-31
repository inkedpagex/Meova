'use client';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Step1, StepBar } from './_parts';
import { Step2, Step3 } from './_steps';

const INITIAL = {
  full_name: '',
  username: '',
  gender: '',
  photo_url: '',
  year: '',
  branch: '',
  university: '',
  bio: '',
  instagram: '',
  interests: [],
};

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function OnboardingClient({ initialName = '', initialPhoto = '' }) {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState({ ...INITIAL, full_name: initialName, photo_url: initialPhoto });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  React.useEffect(() => {
    setData(prev => ({
      ...prev,
      full_name: prev.full_name || initialName || '',
      photo_url: prev.photo_url || initialPhoto || '',
    }));
  }, [initialName, initialPhoto]);

  const onChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const goNext = () => { setDir(1); setStep(s => s + 1); };
  const goBack = () => { setDir(-1); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          full_name: data.full_name,
          gender: data.gender,
          year: data.year,
          branch: data.branch,
          university: data.university,
          bio: data.bio,
          interests: data.interests,
          instagram: data.instagram,
          photo_url: data.photo_url,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Something went wrong. Please try again.'); setLoading(false); return; }
      // Show success animation while Firestore propagates profileComplete:true (800ms).
      // Without this pause, slower devices hit a redirect loop causing ERR_FAILED.
      setDone(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success / launch screen ──────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'linear-gradient(135deg, #F05A00 0%, #D94F00 50%, #ec4899 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <style>{`
          @keyframes ob-pulse {
            0%   { transform: scale(0.85); opacity: 0.5; }
            50%  { transform: scale(1.18); opacity: 0.12; }
            100% { transform: scale(0.85); opacity: 0.5; }
          }
          @keyframes ob-pop {
            0%   { transform: scale(0); opacity: 0; }
            65%  { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes ob-check {
            from { stroke-dashoffset: 50; opacity: 0; }
            10%  { opacity: 1; }
            to   { stroke-dashoffset: 0; opacity: 1; }
          }
          @keyframes ob-bar {
            from { width: 0%; }
            to   { width: 100%; }
          }
          @keyframes ob-up {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          animation: 'ob-pulse 1.4s ease-in-out infinite',
        }} />

        {/* Checkmark circle */}
        <div style={{
          width: 84, height: 84, borderRadius: '50%',
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'ob-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
          boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
          position: 'relative', zIndex: 1,
        }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="50"
              style={{ animation: 'ob-check 0.45s ease 0.35s both' }}
            />
          </svg>
        </div>

        {/* Text */}
        <div style={{
          marginTop: 28, textAlign: 'center', position: 'relative', zIndex: 1,
          animation: 'ob-up 0.45s ease 0.2s both',
        }}>
          <p style={{ fontWeight: 900, fontSize: 22, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
            You&apos;re all set!
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 6, margin: '6px 0 0' }}>
            Opening Meova for you…
          </p>
        </div>

        {/* Progress bar — fills in 0.75s matching the 800ms delay */}
        <div style={{
          marginTop: 36, width: 190, height: 4, position: 'relative', zIndex: 1,
          background: 'rgba(255,255,255,0.22)', borderRadius: 99, overflow: 'hidden',
          animation: 'ob-up 0.45s ease 0.3s both',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'rgba(255,255,255,0.92)',
            animation: 'ob-bar 0.72s cubic-bezier(0.4,0,0.2,1) 0.08s both',
          }} />
        </div>
      </div>
    );
  }

  // ── Onboarding steps ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <img src="/logo.png" alt="Meova" className="h-8 w-8 object-contain rounded-lg shadow-sm" />
          <span className="font-black text-[18px] tracking-tight text-zinc-900">Meova</span>
        </div>

        {/* Tagline */}
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-widest text-[#F05A00] mb-1">Complete your profile</p>
          <p className="text-[11px] text-zinc-400">Step {step} of 3 — takes less than 2 minutes</p>
        </div>

        {/* Progress bar */}
        <StepBar step={step}/>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {step === 1 && <Step1 data={data} onChange={onChange} onNext={goNext}/>}
            {step === 2 && <Step2 data={data} onChange={onChange} onNext={goNext} onBack={goBack}/>}
            {step === 3 && <Step3 data={data} onChange={onChange} onSubmit={handleSubmit} onBack={goBack} loading={loading} error={error}/>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"/>
    </div>
  );
}
