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
      let json = {};
      try {
        json = await res.json();
      } catch (_) {}

      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setDone(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      window.location.href = '/';
    } catch (err) {
      setError(err?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success / launch screen ──────────────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 anim-fade-in">
        <style>{`
          @keyframes ob-pulse {
            0%   { transform: scale(0.85); opacity: 0.6; }
            50%  { transform: scale(1.25); opacity: 0.15; }
            100% { transform: scale(0.85); opacity: 0.6; }
          }
          @keyframes ob-pop {
            0%   { transform: scale(0); opacity: 0; }
            65%  { transform: scale(1.12); opacity: 1; }
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
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(240,90,0,0.12)',
          animation: 'ob-pulse 1.4s ease-in-out infinite',
        }} />

        {/* Checkmark circle */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F05A00 0%, #D94F00 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'ob-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
          boxShadow: '0 12px 30px rgba(240,90,0,0.3)',
          position: 'relative', zIndex: 1,
        }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="50"
              style={{ animation: 'ob-check 0.45s ease 0.25s both' }}
            />
          </svg>
        </div>

        {/* Text */}
        <div style={{
          marginTop: 24, textAlign: 'center', position: 'relative', zIndex: 1,
          animation: 'ob-up 0.45s ease 0.15s both',
        }}>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">
            You&apos;re all set!
          </h2>
          <p className="text-sm font-bold text-zinc-400 mt-1.5">
            Opening Meova for you…
          </p>
        </div>

        {/* Progress bar — fills cleanly in orange */}
        <div style={{
          marginTop: 32, width: 200, height: 5, position: 'relative', zIndex: 1,
          background: '#f4f4f5', borderRadius: 99, overflow: 'hidden',
          animation: 'ob-up 0.45s ease 0.25s both',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #F05A00, #D94F00)',
            animation: 'ob-bar 0.72s cubic-bezier(0.4,0,0.2,1) 0.05s both',
          }} />
        </div>
      </div>
    );
  }

  // ── Onboarding steps ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      {/* ── Ultra-Compact Top Header Bar ── */}
      <header className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-zinc-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="p-1.5 -ml-1 rounded-xl text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-all active:scale-95 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          ) : (
            <div className="w-7 h-7 rounded-xl bg-[#F05A00] text-white flex items-center justify-center font-black text-xs shadow-md shadow-orange-500/20">
              M
            </div>
          )}
          <div>
            <span className="font-black text-xs text-zinc-950 block leading-none">
              {step === 1 ? 'Your Identity' : step === 2 ? 'Academic Info' : 'Vibe & Interests'}
            </span>
            <span className="text-[10px] font-bold text-zinc-400">Step {step} of 3</span>
          </div>
        </div>

        {/* Modern 3-Segment Progress Bar */}
        <div className="flex items-center gap-1.5 w-24 sm:w-32">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-[#F05A00]' : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>
      </header>

      {/* ── Step Content (Keyboard Optimized Scrollable Container) ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-16 max-w-md w-full mx-auto pb-safe">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            {step === 1 && <Step1 data={data} onChange={onChange} onNext={goNext}/>}
            {step === 2 && <Step2 data={data} onChange={onChange} onNext={goNext} onBack={goBack}/>}
            {step === 3 && <Step3 data={data} onChange={onChange} onSubmit={handleSubmit} onBack={goBack} loading={loading} error={error}/>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
