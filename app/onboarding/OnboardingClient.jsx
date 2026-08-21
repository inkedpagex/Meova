'use client';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Step1, StepBar } from './_parts';
import { Step2, Step3 } from './_steps';

const INITIAL = {
  full_name: '',
  username: '',
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
      // Show success screen while Firestore propagates profileComplete:true.
      // Without this delay, slower devices get a redirect loop (/ → onboarding → /) = ERR_FAILED.
      setDone(true);
      await new Promise(resolve => setTimeout(resolve, 1800));
      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center gap-4">
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px #7c3aed44' }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontWeight: 800, fontSize: 20, color: '#18181b' }}>Profile created! 🎉</p>
        <p style={{ fontSize: 14, color: '#71717a' }}>Taking you to Meetify…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-black text-[16px] text-zinc-900">meetifyy</span>
        </div>

        {/* Tagline */}
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-widest text-[#7c3aed] mb-1">Complete your profile</p>
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
