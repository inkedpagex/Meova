'use client';

import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2, ShieldCheck, Lock, AlertCircle, ArrowRight } from '@/lib/icons';
import Image from 'next/image';

export default function AdminAuthForm() {
  const { loading, logInWithGoogle, logOut } = useAuth();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginWithGoogleGIS = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const res = await logInWithGoogle(null, tokenResponse.access_token, true, 'admin-2026.1');
        
        if (res?.success) {
          const userRole = res.data?.user?.role;
          const isAdmin = res.data?.isAdmin || userRole === 'admin';

          if (isAdmin) {
            // Authorized admin -> redirect straight to admin dashboard
            window.location.href = '/admin';
          } else {
            // Unauthorized account -> clear session and show security rejection
            await logOut();
            setError(
              `Access Denied: Account (${res.data?.user?.email || 'this user'}) is not registered with administrator privileges. Platform operations are restricted.`
            );
          }
        } else {
          setError(res?.error?.message || 'Google sign-in failed. Please verify admin credentials.');
        }
      } catch (err) {
        setError(err.message || 'Authentication error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      setError('Google authentication failed. Please try again.');
      setIsSubmitting(false);
    },
  });

  const handleInitiateAdminLogin = () => {
    setError(null);
    loginWithGoogleGIS();
  };

  const isProd = process.env.NODE_ENV === 'production';
  const campusAppUrl = isProd ? 'https://meova.in' : 'http://localhost:3000';

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      <div className="w-full max-w-[440px] relative z-10 flex flex-col items-center">
        
        {/* Top Operational Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-[12px] font-medium tracking-wide mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="whitespace-nowrap">Meova Control Center · Operations</span>
        </div>

        {/* ── CENTRAL ELEVATED ADMIN AUTH CARD ──────────────────────────── */}
        <div className="w-full bg-white rounded-[32px] p-7 sm:p-9 shadow-2xl border border-black/10 flex flex-col items-center text-center">
          
          {/* Logo & Shield Badge */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="w-16 h-16 rounded-[22px] bg-black p-3.5 shadow-md flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Meova" 
                className="w-full h-full object-contain filter brightness-0 invert" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7657D9] border-2 border-white flex items-center justify-center text-white shadow-xs">
              <ShieldCheck size={13} strokeWidth={2.5} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[26px] sm:text-[28px] font-extrabold text-black tracking-tight mb-2">
            Admin Portal
          </h1>
          <p className="text-[14px] text-black/70 leading-relaxed font-normal mb-6 max-w-[320px]">
            Restricted operations gateway for platform analytics, user safety, and financial settlements.
          </p>

          {/* Security Alert if Non-Admin attempts login */}
          {error && (
            <div className="w-full mb-6 p-3.5 rounded-[18px] bg-red-50 border border-red-200 text-left flex items-start gap-3 anim-scale-in">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-red-700 font-medium leading-snug">
                {error}
              </p>
            </div>
          )}

          {/* Google Sign-in CTA */}
          <button
            type="button"
            onClick={handleInitiateAdminLogin}
            disabled={loading || isSubmitting}
            className="w-full h-[52px] px-6 rounded-[20px] bg-black hover:bg-black/90 active:scale-[0.99] text-white font-semibold text-[14px] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
          >
            {loading || isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin text-white flex-shrink-0" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <svg width={18} height={18} viewBox="0 0 24 24" className="flex-shrink-0">
                  <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                </svg>
                <span>Sign in with Google Admin</span>
              </>
            )}
          </button>

          {/* Security Compliance Micro-copy */}
          <div className="mt-6 pt-5 border-t border-black/10 w-full flex items-center justify-center gap-2 text-[11.5px] text-black/60 font-medium">
            <Lock size={12} className="text-[#7657D9] flex-shrink-0" />
            <span>256-bit Encrypted · Role-Gated Access · Session Monitored</span>
          </div>

        </div>

        {/* Exit link back to Campus Hub */}
        <a
          href={campusAppUrl}
          className="mt-6 text-[13px] font-medium text-white/70 hover:text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <span>Return to Meova Campus App</span>
          <ArrowRight size={14} className="flex-shrink-0" />
        </a>

      </div>
    </div>
  );
}
