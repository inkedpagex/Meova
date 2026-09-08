'use client';

import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { useSearchParams } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  Loader2, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from '@/lib/icons';
import Link from 'next/link';

export default function AuthForm({ defaultMode = 'login' }) {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || searchParams.get('redirect') || '/';
  const { loading, logInWithGoogle } = useAuth();
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(defaultMode);

  const loginWithGoogleGIS = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      const res = await logInWithGoogle(null, tokenResponse.access_token, true, '2026.1');
      if (res?.success) {
        const isProd = process.env.NODE_ENV === 'production';
        const cleanHost =
          typeof window !== 'undefined'
            ? window.location.host.replace(/^(app|admin|ambassador)\./, '')
            : 'localhost:3000';
        const appBase = isProd ? 'https://app.meova.in' : `http://${cleanHost}`;

        if (res.data?.isNewUser || res.data?.user?.profile_complete === false) {
          window.location.href = `${appBase}/onboarding`;
        } else {
          const isRelativePath =
            nextPath &&
            nextPath.startsWith('/') &&
            !nextPath.startsWith('/login') &&
            !nextPath.startsWith('/signup');
          window.location.href = isRelativePath ? `${appBase}${nextPath}` : appBase;
        }
      } else if (res?.error) {
        setError(res.error.message || 'Google sign-in failed. Please try again.');
      }
    },
    onError: () => {
      setError('Google sign-in failed. Please try again.');
    },
  });

  const handleInitiateGoogleAuth = () => {
    setError(null);
    loginWithGoogleGIS();
  };

  const isSignup = mode === 'signup';
  const isProd = process.env.NODE_ENV === 'production';
  const cleanHost =
    typeof window !== 'undefined'
      ? window.location.host.replace(/^(app|admin|ambassador)\./, '')
      : 'localhost:3000';
  const rootHomeUrl = isProd ? 'https://meova.in' : `http://${cleanHost}`;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-black font-sans selection:bg-[#7657D9] selection:text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      
      {/* ── TOP MINIMAL BRAND HEADER ────────────────────────────────────────── */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <a href={rootHomeUrl} className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="w-9 h-9 rounded-2xl bg-[#7657D9] p-1.5 shadow-xs flex items-center justify-center flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Meova" 
              className="w-full h-full object-contain filter brightness-0 invert" 
            />
          </div>
          <span className="font-extrabold text-[20px] tracking-tight text-black">Meova</span>
        </a>

        <a
          href={rootHomeUrl}
          className="text-[13px] font-semibold text-black/70 hover:text-black transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
        >
          <span>Back to Home</span>
          <ArrowRight size={14} className="flex-shrink-0" />
        </a>
      </header>

      {/* ── CENTER ELEVATED AUTH CARD ───────────────────────────────────────── */}
      <div className="w-full max-w-[420px] mx-auto my-auto py-6">
        <div className="w-full bg-white rounded-[32px] border border-black/10 p-7 sm:p-9 shadow-xl flex flex-col items-center text-center">
          
          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-[#7657D9] p-2.5 shadow-md flex items-center justify-center mb-5 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Meova" 
              className="w-full h-full object-contain filter brightness-0 invert" 
            />
          </div>

          {/* Heading */}
          <h1 className="text-[26px] sm:text-[28px] font-extrabold text-black tracking-tight mb-2">
            {isSignup ? 'Create your Meova account' : 'Log in to Meova'}
          </h1>
          <p className="text-[14px] text-black/70 leading-relaxed font-normal mb-6 max-w-[320px]">
            {isSignup 
              ? 'Join your verified campus network. Connect with peers, book coffee meetups, and explore circles.'
              : 'Welcome back! Sign in to access your campus feed, chats, circles, and sparks.'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-5 p-3.5 rounded-[18px] bg-red-50 border border-red-200 text-left flex items-start gap-2.5">
              <AlertCircle size={17} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-red-700 font-medium leading-snug">
                {error}
              </p>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleInitiateGoogleAuth}
            disabled={loading}
            className="w-full h-[52px] px-6 rounded-[20px] bg-white hover:bg-black/5 active:scale-[0.98] border border-black/15 text-black font-semibold text-[14.5px] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-black/70 flex-shrink-0" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg width={20} height={20} viewBox="0 0 24 24" className="flex-shrink-0">
                  <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Switch Mode Link */}
          <div className="mt-5 text-[13px] text-black/70 font-medium">
            {isSignup ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#7657D9] hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </span>
            ) : (
              <span>
                New to Meova?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-bold text-[#7657D9] hover:underline cursor-pointer"
                >
                  Join free
                </button>
              </span>
            )}
          </div>

          {/* Verified Campus Badge */}
          <div className="mt-6 pt-5 border-t border-black/10 w-full flex items-center justify-center gap-1.5 text-[11.5px] text-black/60 font-medium">
            <ShieldCheck size={14} className="text-[#10B981] flex-shrink-0" />
            <span>Strictly Encrypted · Verified University Platform</span>
          </div>

          {/* Legal micro-copy */}
          <p className="text-[11px] leading-relaxed text-black/60 text-center mt-3 max-w-[320px]">
            By continuing, you accept our{' '}
            <a href={`${rootHomeUrl}/terms`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#7657D9] hover:underline">
              Terms
            </a>
            ,{' '}
            <a href={`${rootHomeUrl}/privacy`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#7657D9] hover:underline">
              Privacy Policy
            </a>
            , and{' '}
            <a href={`${rootHomeUrl}/community-guidelines`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#7657D9] hover:underline">
              Guidelines
            </a>
            .
          </p>

        </div>
      </div>

      {/* ── BOTTOM MINIMAL FOOTER ───────────────────────────────────────────── */}
      <footer className="w-full max-w-5xl mx-auto py-3 text-center text-[12px] text-black/50 font-medium flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>© 2026 Meova</span>
        <span>·</span>
        <a href={`${rootHomeUrl}/help`} className="hover:text-black transition-colors">Help Center</a>
        <span>·</span>
        <a href={`${rootHomeUrl}/terms`} className="hover:text-black transition-colors">Terms of Service</a>
        <span>·</span>
        <a href={`${rootHomeUrl}/privacy`} className="hover:text-black transition-colors">Privacy Policy</a>
        <span>·</span>
        <a href={`${rootHomeUrl}/community-guidelines`} className="hover:text-black transition-colors">Community Guidelines</a>
      </footer>

    </div>
  );
}
