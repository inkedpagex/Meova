'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, GraduationCap, BookOpen, Tag, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
    e.preventDefault();
    setClientError(null);
    if (isSignUp) {
      if (!fullName || !branch) return setClientError('Name and branch required.');
      if (interests.length !== 3) return setClientError('Select exactly 3 interests.');
      const res = await signUp({ email, password, fullName, year, branch, interests });
      if (res.success) { router.push(nextPath); router.refresh(); }
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
    w-full bg-[#0f0f0f] border border-[#222] rounded-xl px-4 py-3
    text-[14px] text-white placeholder-[#404040] font-medium
    focus:outline-none focus:border-[#444] transition-colors
  `;
  const labelCls = "block text-[11px] font-bold text-[#555] uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-[calc(100dvh-56px)] md:min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.5)]">
              <span className="text-black font-black text-2xl leading-none">m</span>
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold text-white tracking-[-0.5px]">meetify</h1>
              <p className="text-[12px] text-[#555] mt-0.5 font-medium">Campus social network</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 space-y-5"
          style={{ background: '#080808', border: '1px solid #1a1a1a' }}
        >
          <div>
            <h2 className="text-[17px] font-bold text-white tracking-tight">
              {isSignUp ? (step === 1 ? 'Create account' : 'Your profile') : 'Welcome back'}
            </h2>
            <p className="text-[12px] text-[#555] mt-0.5">
              {isSignUp ? 'Join campus in 2 steps' : 'Sign in to your meetify account'}
            </p>
          </div>

          {/* Error */}
          {err && (
            <div className="text-[12px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
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
                  className="w-full bg-white text-black font-bold text-[14px] py-3 rounded-xl hover:bg-[#e8e8e8] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                  {loading ? <Loader2 size={16} className="animate-spin" />
                    : isSignUp ? <><span>Continue</span><ChevronRight size={15} /></>
                    : 'Log in'
                  }
                </button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1a1a1a]"></div>
                </div>
                <span className="relative px-3 bg-[#080808] text-[10px] font-bold text-[#555] uppercase tracking-wider">or</span>
              </div>

              <button type="button" onClick={handleGoogleSubmit} disabled={loading}
                className="w-full bg-transparent border border-[#222] hover:border-[#444] text-white font-semibold text-[13px] py-3 rounded-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50">
                {loading ? (
                  <Loader2 size={15} className="animate-spin text-neutral-400" />
                ) : (
                  <svg className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{loading ? "Logging in..." : "Continue with Google"}</span>
              </button>
            </>
          )}

          {/* Step 2: profile */}
          {isSignUp && step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Your name" className={inputCls} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Year</label>
                  <select value={year} onChange={e => setYear(e.target.value)} className={inputCls + " cursor-pointer"}>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Branch</label>
                  <input type="text" value={branch} onChange={e => setBranch(e.target.value)}
                    placeholder="e.g. CSE" className={inputCls} required />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className={labelCls + " mb-0"}>Pick 3 interests</label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                    interests.length === 3 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {interests.length}/3
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-3 max-h-[140px] overflow-y-auto">
                  {INTERESTS.map(tag => {
                    const sel = interests.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() => toggleInterest(tag)}
                        className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all
                          ${sel
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-[#777] border-[#252525] hover:border-[#444] hover:text-[#ccc]'
                          }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-shrink-0 border border-[#222] text-[#777] text-[13px] font-semibold px-4 py-3 rounded-xl hover:border-[#333] hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronLeft size={14} /> Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading || interests.length !== 3}
                  className="flex-1 bg-white text-black font-bold text-[13px] py-3 rounded-xl hover:bg-[#e8e8e8] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : interests.length === 3 ? (
                    'Create account'
                  ) : (
                    `Select ${3 - interests.length} more`
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Toggle */}
        <p className="text-center text-[13px] text-[#555] mt-6">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button"
            onClick={() => { setIsSignUp(v => !v); setStep(1); setClientError(null); }}
            className="text-white font-semibold hover:underline"
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
