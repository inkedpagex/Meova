'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSearchParams } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2, Users, Calendar, Trophy, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AuthForm({ defaultMode = 'login' }) {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const { loading, logInWithGoogle } = useAuth();
  const [error, setError] = useState(null);

  // Handle Google redirect result (mobile fallback)
  useEffect(() => {
    async function checkRedirect() {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const { auth } = await import('../../lib/firebaseClient');
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          const { createProfileAdmin } = await import('./auth.actions');
          await createProfileAdmin(idToken, {
            id: result.user.uid,
            email: result.user.email,
            full_name: result.user.displayName || result.user.email.split('@')[0],
            photo_url: result.user.photoURL || '',
            year: '1st', branch: 'General', interests: [],
          });
          const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          if (res.ok) window.location.href = nextPath;
        }
      } catch (err) {
        console.error('Redirect result error:', err);
      }
    }
    checkRedirect();
  }, [nextPath]);

  const loginWithGoogleGIS = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      // useGoogleLogin implicit flow returns an access_token. We pass this to Firebase.
      const res = await logInWithGoogle(null, tokenResponse.access_token);
      if (res?.success) {
        if (res.data?.isNewUser) {
          window.location.href = '/profile';
        } else {
          window.location.href = nextPath;
        }
      } else if (res?.error) {
        setError(res.error.message || 'Google sign-in failed. Please try again.');
      }
    },
    onError: () => {
      setError('Google sign-in failed. Please try again.');
    },
  });

  const features = [
    { Icon: Users,    title: 'Find your people',       desc: 'Connect with students who share your vibe.' },
    { Icon: Calendar, title: 'Join exciting experiences', desc: 'From coffee meets to tournaments.' },
    { Icon: Trophy,   title: 'Build communities',      desc: 'Start or join communities around shared interests.' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex bg-white overflow-hidden">

      {/* ── LEFT: Branding Panel ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-[#f3f0ff] p-14 relative overflow-hidden select-none">
        {/* Subtle bg blob */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#7c3aed]/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/4 translate-y-1/4" />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-black text-[20px] tracking-tight text-zinc-900">meetifyy</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 mt-10">
          <h1 className="text-[42px] font-black leading-[1.1] tracking-tight text-zinc-900">
            Meet people.<br />
            Join experiences.<br />
            <span style={{ color: '#7c3aed' }}>Make college count.</span>
          </h1>
          <p className="text-[15px] text-zinc-500 font-medium mt-4 leading-relaxed max-w-[340px]">
            The social discovery platform<br />built for your campus.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-5">
            {features.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-[#ede9fe]">
                  <Icon size={16} style={{ color: '#7c3aed' }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-zinc-800">{title}</p>
                  <p className="text-[12px] text-zinc-400 font-medium mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Illustration */}
        <div className="relative z-10 flex justify-center mt-8">
          <img
            src="/login-hero.png"
            alt="Campus students"
            className="w-full max-w-[420px] object-contain drop-shadow-xl"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(124,58,237,0.15))' }}
          />
        </div>
      </div>

      {/* ── RIGHT: Login Panel ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 relative bg-white">

        {/* Top-right: Already have account? */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <span className="text-[13px] text-zinc-400 font-medium">New here?</span>
          <Link href="/signup"
            className="px-5 py-2 rounded-full text-[12px] font-black text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
            Create Account
          </Link>
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-black text-[18px] text-zinc-900">meetifyy</span>
        </div>

        {/* Card */}
        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-[28px] font-black text-zinc-900 tracking-tight">
              Welcome back! 👋
            </h2>
            <p className="text-[14px] text-zinc-400 font-medium mt-2">
              Login to continue your campus journey
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-[12px] font-semibold text-red-600 bg-red-50 border border-red-100">
              {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={() => loginWithGoogleGIS()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-zinc-100 bg-white hover:bg-zinc-50 hover:border-[#7c3aed]/20 transition-all font-semibold text-[14px] text-zinc-700 cursor-pointer active:scale-[0.98] disabled:opacity-60 shadow-sm"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-zinc-400" />
            ) : (
              <svg width={20} height={20} viewBox="0 0 24 24">
                <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
            )}
            <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
          </button>

          {/* Terms */}
          <p className="text-center text-[11px] text-zinc-400 mt-6 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-[#7c3aed] font-semibold hover:underline">Terms of Service</a>
            {' '}·{' '}
            <a href="#" className="text-[#7c3aed] font-semibold hover:underline">Privacy Policy</a>
          </p>

          {/* Secure badge */}
          <div className="mt-8 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-zinc-50 border border-zinc-100">
            <ShieldCheck size={16} className="text-[#7c3aed]" strokeWidth={2} />
            <div className="text-left">
              <p className="text-[12px] font-black text-zinc-700">Secure login</p>
              <p className="text-[10px] text-zinc-400">Your data is encrypted and safe with us.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
