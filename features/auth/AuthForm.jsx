'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, GraduationCap, BookOpen, Tag, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getCartoonAvatar } from '../../utils/avatar';

const INTERESTS = [
  'Coding & Tech', 'Music & Bands', 'Dance', 'Photography & Film',
  'Public Speaking', 'Art & Sketching', 'Sports & Fitness',
  'Gaming & E-sports', 'Literature & Poetry', 'Entrepreneurship',
  'Theatre & Drama', 'Anime & Manga', 'Volunteering', 'Fashion', 'Astronomy',
];

export default function AuthForm({ defaultMode = 'login' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const { loading, error, signUp, logIn, logInWithGoogle } = useAuth();

  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [step, setStep] = useState(1);
  const [clientError, setClientError] = useState(null);

  useEffect(() => {
    async function checkRedirect() {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const { auth } = await import('../../lib/firebaseClient');
        const userCredential = await getRedirectResult(auth);
        if (userCredential && userCredential.user) {
          const user = userCredential.user;
          
          const { createProfileAdmin } = await import('./auth.actions');
          const idToken = await user.getIdToken();
          
          await createProfileAdmin(idToken, {
            id: user.uid,
            email: user.email,
            full_name: user.displayName || user.email.split('@')[0],
            year: '1st',
            branch: 'General',
            interests: []
          });

          const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          if (res.ok) {
            router.push(nextPath);
            router.refresh();
          }
        }
      } catch (err) {
        console.error("Redirect login result check failed:", err);
      }
    }
    checkRedirect();
  }, [router, nextPath]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [year, setYear] = useState('1st');
  const [branch, setBranch] = useState('');
  const [interests, setInterests] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');

  // Tinder onboarding state variables
  const [subStep, setSubStep] = useState(1);
  const [bdayDay, setBdayDay] = useState('');
  const [bdayMonth, setBdayMonth] = useState('');
  const [bdayYear, setBdayYear] = useState('');
  const [lookingFor, setLookingFor] = useState('📚 Co-studying & Projects');
  const [studyStyle, setStudyStyle] = useState('👥 Interactive group study');
  const [isHost, setIsHost] = useState('both');

  const toggleInterest = (tag) => {
    setClientError(null);
    if (interests.includes(tag)) {
      setInterests(interests.filter(i => i !== tag));
    } else {
      if (interests.length >= 3) { setClientError('Pick exactly 3 interests.'); return; }
      setInterests([...interests, tag]);
    }
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    setClientError(null);
    if (!email || !password || !confirmPassword) return setClientError('All fields required.');
    if (!email.includes('@')) return setClientError('Enter a valid email.');
    if (password.length < 6) return setClientError('Password must be 6+ characters.');
    if (password !== confirmPassword) return setClientError('Passwords do not match.');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setClientError(null);
    if (isSignUp) {
      if (!fullName) return setClientError('Name is required.');
      if (!branch) return setClientError('Branch is required.');
      if (!photoUrl) return setClientError('Profile image is required.');
      if (interests.length !== 3) return setClientError('Select exactly 3 interests.');

      let calculatedAge = 20;
      if (bdayYear) {
        const currentYear = new Date().getFullYear();
        calculatedAge = currentYear - Number(bdayYear);
        if (calculatedAge < 16 || calculatedAge > 50) {
          calculatedAge = 20;
        }
      }

      const res = await signUp({
        email,
        password,
        fullName,
        year,
        branch,
        interests,
        photoUrl,
        age: calculatedAge,
        lookingFor,
        studyStyle,
        isHost: isHost === 'host' || isHost === 'both'
      });
      if (res.success) {
        router.push(nextPath);
        router.refresh();
      }
    } else {
      if (!email || !password) return setClientError('Email and password required.');
      const res = await logIn({ email, password });
      if (res.success) { router.push(nextPath); router.refresh(); }
    }
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setClientError(null);
    const res = await logInWithGoogle();
    if (res.success) {
      router.push(nextPath);
      router.refresh();
    }
  };

  const err = clientError || error;

  const inputCls = `
    w-full bg-white border border-zinc-200 rounded-[14px] px-4 py-3.5
    text-[14px] text-zinc-950 placeholder-zinc-400 font-semibold
    focus:outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]
  `;
  const labelCls = "block text-[10px] font-black text-zinc-950 uppercase tracking-widest mb-2 ml-1";

  return (
    <div className="fixed inset-0 z-[100] grid grid-cols-1 md:grid-cols-12 bg-white overflow-y-auto">
      {/* Left side: Premium Branding Panel (visible on md+) */}
      <div className="hidden md:flex md:col-span-5 lg:col-span-6 bg-zinc-950 text-white flex-col justify-between p-14 relative overflow-hidden">
        {/* Subtle background abstract shapes for premium look */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#7c3aed]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#3b82f6]/20 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-white">meetifyy</span>
        </div>

        {/* Feature Teasers */}
        <div className="my-auto space-y-8 relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white">
            Your campus life,<br />all in one place.
          </h2>
          <p className="text-[14px] text-zinc-300 font-medium leading-relaxed">
            Meet interesting people, book experiences, join interest circles, and participate in tournaments across your university.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-2xl font-black text-white">5,000+</p>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 mt-1">Students</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">200+</p>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 mt-1">Circles</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">12,000+</p>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 mt-1">Connections</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-zinc-400 font-semibold relative z-10">
          © {new Date().getFullYear()} meetifyy. All rights campus-locked.
        </div>
      </div>

      {/* Right side: Login Form Container */}
      <div className="col-span-1 md:col-span-7 lg:col-span-6 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[380px]">

          {/* Logo (hidden on desktop, since left panel has it) */}
          <div className="text-center mb-8 md:hidden">
            <div className="inline-flex flex-col items-center gap-3">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(124,58,237,0.3)',
                }}
              >
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold text-zinc-950 tracking-[-0.5px]">meetify</h1>
                <p className="text-[12px] text-zinc-400 mt-0.5 font-semibold">Campus social network</p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="w-full space-y-6 pt-4">
          <div className="text-center md:text-left mb-2">
            <h2 className="text-[22px] md:text-[28px] font-black text-zinc-950 tracking-tight">
              {isSignUp ? (step === 1 ? 'Create account' : 'Your profile') : 'Welcome back'}
            </h2>
            <p className="text-[13px] md:text-[14px] text-zinc-500 font-medium mt-1">
              {isSignUp ? 'Join campus in 2 steps' : 'Sign in to your meetify account'}
            </p>
          </div>

          {/* Error */}
          {err && (
            <div className="text-[12px] font-bold text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
              {err}
            </div>
          )}

          {/* Step 1: credentials */}
          {(!isSignUp || step === 1) && (
            <>
              <form onSubmit={isSignUp ? handleStep1 : handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="student@university.edu" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputCls} required />
                </div>
                {isSignUp && (
                  <div>
                    <label className={labelCls}>Confirm password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" className={inputCls} required />
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-[13px] py-3.5 rounded-[14px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] hover:-translate-y-0.5">
                  {loading ? <Loader2 size={16} className="animate-spin" />
                    : isSignUp ? <><span>Continue</span><ChevronRight size={15} /></>
                    : 'Log in'
                  }
                </button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#f0f0f2]"></div>
                </div>
                <span className="relative px-3 bg-white text-[10px] font-black text-zinc-400 uppercase tracking-wider">or</span>
              </div>

              <button type="button" onClick={handleGoogleSubmit} disabled={loading}
                className="w-full bg-white border border-[#e4e4e7] hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold text-[13px] py-3.5 rounded-[14px] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {loading ? (
                  <Loader2 size={15} className="animate-spin text-zinc-400" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  </svg>
                )}
                <span>{loading ? "Logging in..." : "Continue with Google"}</span>
              </button>
            </>
          )}

          {/* Step 2: Profile Onboarding Sub-Wizard */}
          {isSignUp && step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Header Progress Bar & Skip controls */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (subStep > 1) {
                      setSubStep(subStep - 1);
                    } else {
                      setStep(1);
                    }
                  }}
                  className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-800 hover:border-zinc-300 transition-all cursor-pointer bg-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex-1 bg-[#e4e4e7] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#7c3aed] h-full transition-all duration-300"
                    style={{ width: `${(subStep / 9) * 100}%` }}
                  />
                </div>
                
                {[5, 6, 7, 8, 9].includes(subStep) ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (subStep === 8) {
                        setInterests(['Coding & Tech', 'Music & Bands', 'Art & Sketching']);
                        setSubStep(9);
                      } else if (subStep === 9) {
                        const seed = fullName.trim() || 'student';
                        const generatedUrl = getCartoonAvatar(seed);
                        setPhotoUrl(generatedUrl);
                        // Trigger registration submit with auto-filled avatar
                        setTimeout(() => {
                          const submitBtn = document.getElementById('signup-finish-btn');
                          if (submitBtn) submitBtn.click();
                        }, 50);
                      } else {
                        setSubStep(subStep + 1);
                      }
                    }}
                    className="text-xs font-black text-[#7c3aed] hover:text-[#6d28d9] transition-colors cursor-pointer px-2 py-1 uppercase tracking-wider"
                  >
                    Skip
                  </button>
                ) : (
                  <span className="text-[10px] font-black text-zinc-400 tracking-wider w-8 text-right select-none">
                    {subStep}/9
                  </span>
                )}
              </div>

              {/* SubStep Contents */}
              <div className="min-h-[290px] flex flex-col justify-center">

                {/* Substep 1: Full name */}
                {subStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                      What's your full name?
                    </h3>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      className={inputCls}
                      required
                      autoFocus
                    />
                    <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                      This is how it will appear on your campus profile.
                    </p>
                  </div>
                )}

                {/* Substep 2: Birthday & Age Calculation */}
                {subStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                      Your b-day?
                    </h3>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="DD"
                        value={bdayDay}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setBdayDay(val);
                          if (val.length === 2) document.getElementById('bday-month')?.focus();
                        }}
                        className={inputCls + " text-center text-lg tracking-widest"}
                      />
                      <span className="text-zinc-300 text-xl font-bold">/</span>
                      <input
                        id="bday-month"
                        type="text"
                        maxLength={2}
                        placeholder="MM"
                        value={bdayMonth}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setBdayMonth(val);
                          if (val.length === 2) document.getElementById('bday-year')?.focus();
                        }}
                        className={inputCls + " text-center text-lg tracking-widest"}
                      />
                      <span className="text-zinc-300 text-xl font-bold">/</span>
                      <input
                        id="bday-year"
                        type="text"
                        maxLength={4}
                        placeholder="YYYY"
                        value={bdayYear}
                        onChange={(e) => setBdayYear(e.target.value.replace(/\D/g, ''))}
                        className={inputCls + " text-center text-lg tracking-widest"}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                      Your profile shows your age, not your date of birth.
                    </p>
                    {bdayYear.length === 4 && (
                      <div className="text-[11px] font-black text-[#7c3aed] bg-[#f5f3ff] border border-[#ddd6fe] rounded-xl px-3 py-2 text-center anim-fade-in">
                        We calculated your age as: {new Date().getFullYear() - Number(bdayYear)} years
                      </div>
                    )}
                  </div>
                )}

                {/* Substep 3: Academic Year */}
                {subStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                      What's your academic year?
                    </h3>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Post Graduate / MBA'].map((opt) => {
                        const val = opt.startsWith('Post') ? 'PG' : opt.split(' ')[0];
                        const isSel = year === val;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setYear(val);
                              setTimeout(() => setSubStep(4), 150);
                            }}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                              isSel
                                ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-[0_4px_12px_rgba(124,58,237,0.15)]'
                                : 'bg-[#f4f4f6] text-zinc-700 border-[#e4e4e7] hover:border-zinc-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Substep 4: Branch of study */}
                {subStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                      What's your branch?
                    </h3>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. CSE, Design, ECE"
                      className={inputCls}
                      required
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {['CSE', 'Design', 'ECE', 'MBA', 'Biotech', 'ME'].map((br) => (
                        <button
                          key={br}
                          type="button"
                          onClick={() => {
                            setBranch(br);
                            setTimeout(() => setSubStep(5), 150);
                          }}
                          className={`text-[9px] font-black uppercase tracking-wider px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
                            branch === br
                              ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                              : 'bg-[#f4f4f6] text-zinc-700 border-[#e4e4e7] hover:border-zinc-350'
                          }`}
                        >
                          {br}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Substep 5: Looking For */}
                {subStep === 5 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                        Right now I'm looking for...
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                        Increase compatibility by sharing yours!
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                      {[
                        { val: '🚀 Startup & Tech Collab', label: 'Startup Collab', emoji: '🚀' },
                        { val: '📚 Co-studying & Projects', label: 'Co-Study / Projects', emoji: '📚' },
                        { val: '☕ Coffee & Networking', label: 'Coffee Meet', emoji: '☕' },
                        { val: '🎨 Creative Arts & Design', label: 'Creative Design', emoji: '🎨' },
                        { val: '🤝 New Friends & Hangouts', label: 'New Friends', emoji: '🤝' },
                        { val: '🕹️ Gaming & E-sports', label: 'Gaming Mates', emoji: '🕹️' }
                      ].map((opt) => {
                        const isSel = lookingFor === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setLookingFor(opt.val)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSel
                                ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-[0_4px_12px_rgba(124,58,237,0.15)]'
                                : 'bg-[#f4f4f6] text-zinc-700 border-[#e4e4e7] hover:border-zinc-300'
                            }`}
                          >
                            <span className="text-xl mb-1.5 select-none">{opt.emoji}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider leading-tight">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Substep 6: Study/Work style */}
                {subStep === 6 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                        What's your study style?
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                        Let classmates know how you work best.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { val: '🤫 Quiet library focus', label: 'Quiet Library Focus' },
                        { val: '☕ Cafe brainstorming', label: 'Cafe Brainstorming' },
                        { val: '👥 Interactive group study', label: 'Interactive Group Study' },
                        { val: '🌙 Midnight coding sessions', label: 'Midnight Coding' }
                      ].map((opt) => {
                        const isSel = studyStyle === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setStudyStyle(opt.val);
                              setTimeout(() => setSubStep(7), 150);
                            }}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                              isSel
                                ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-[0_4px_12px_rgba(124,58,237,0.15)]'
                                : 'bg-[#f4f4f6] text-zinc-700 border-[#e4e4e7] hover:border-zinc-300'
                            }`}
                          >
                            {opt.val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Substep 7: Hosting events */}
                {subStep === 7 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                        Do you want to host events?
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                        Choose whether you would like to host hangouts or co-study events.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { val: 'host', label: '🏆 Yes, I want to host' },
                        { val: 'guest', label: '🎒 No, just join as guest' },
                        { val: 'both', label: '🤝 Both, I\'m open!' }
                      ].map((opt) => {
                        const isSel = isHost === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setIsHost(opt.val);
                              setTimeout(() => setSubStep(8), 150);
                            }}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                              isSel
                                ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-[0_4px_12px_rgba(124,58,237,0.15)]'
                                : 'bg-[#f4f4f6] text-zinc-700 border-[#e4e4e7] hover:border-zinc-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Substep 8: What are you into */}
                {subStep === 8 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                          What are you into?
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                          Select exactly 3 interests.
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full transition-colors ${
                        interests.length === 3
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {interests.length}/3
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 bg-[#f4f4f6] border border-[#e4e4e7] rounded-2xl p-4 max-h-[180px] overflow-y-auto">
                      {INTERESTS.map(tag => {
                        const sel = interests.includes(tag);
                        return (
                          <button key={tag} type="button" onClick={() => toggleInterest(tag)}
                            className={`text-[9px] px-3.5 py-2 rounded-full border font-black uppercase tracking-wider transition-all cursor-pointer
                              ${sel
                                ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                                : 'bg-white text-zinc-600 border-[#e4e4e7] hover:border-zinc-400 hover:text-zinc-900'
                              }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Substep 9: Recent Pics */}
                {subStep === 9 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight uppercase">
                        Add your recent pics
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                        Paste a profile photo link or generate an avatar!
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => {
                        const hasPic = index === 0 ? !!photoUrl : false;
                        const picSource = index === 0 ? photoUrl : (photoUrl ? getCartoonAvatar(fullName + index) : null);
                        return (
                          <div
                            key={index}
                            className="aspect-[3/4] bg-[#f4f4f6] border border-dashed border-zinc-200 rounded-2xl overflow-hidden relative flex items-center justify-center select-none"
                          >
                            {picSource ? (
                              <img src={picSource} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-zinc-400">+</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="Paste image URL here"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const seed = fullName.trim() || 'student';
                          setPhotoUrl(getCartoonAvatar(seed));
                        }}
                        className="w-full bg-[#f5f3ff] border border-[#ddd6fe] text-[#7c3aed] py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider hover:bg-[#ede9fe] active:scale-95 transition-all cursor-pointer"
                      >
                        ✨ Generate Cartoon Avatar
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom control buttons */}
              <div className="flex gap-3 pt-2">
                {subStep < 9 ? (
                  <button
                    type="button"
                    disabled={
                      (subStep === 1 && !fullName.trim()) ||
                      (subStep === 2 && (!bdayDay || !bdayMonth || !bdayYear)) ||
                      (subStep === 8 && interests.length !== 3)
                    }
                    onClick={() => setSubStep(subStep + 1)}
                    className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-[11px] uppercase tracking-wider py-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    id="signup-finish-btn"
                    type="submit"
                    disabled={loading || !photoUrl}
                    className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-[11px] uppercase tracking-wider py-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Finish & Create Account'}
                  </button>
                )}
              </div>

            </form>
          )}
        </div>

        {/* Toggle */}
        <p className="text-center text-[13px] font-medium text-zinc-500 mt-8">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button"
            onClick={() => { setIsSignUp(v => !v); setStep(1); setClientError(null); }}
            className="text-[#7c3aed] font-bold hover:text-[#6d28d9] transition-colors cursor-pointer ml-1"
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  </div>
);
}
