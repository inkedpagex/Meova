'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSearchParams } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  ArrowRight, 
  ArrowDown, 
  Radio, 
  CheckCircle2, 
  Lock, 
  Compass, 
  Clock, 
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AuthForm({ defaultMode = 'login' }) {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const { loading, logInWithGoogle } = useAuth();
  const [error, setError] = useState(null);

  const loginWithGoogleGIS = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      const res = await logInWithGoogle(null, tokenResponse.access_token);
      if (res?.success) {
        if (res.data?.isNewUser) {
          window.location.href = '/onboarding';
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

  return (
    <div className="fixed inset-0 z-[100] bg-[#faf9f6] text-zinc-900 overflow-y-auto font-sans selection:bg-[#F05A00] selection:text-white">
      
      {/* ── 1. STICKY TOP NAVIGATION BAR (RESPONSIVE MOBILE + DESKTOP) ────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-zinc-200/70 px-4 sm:px-6 lg:px-16 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F05A00] p-0.5 shadow-xs flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Meova Logo" className="h-4 w-4 sm:h-5 sm:w-5 object-contain filter brightness-0 invert" />
          </div>
          <span className="font-black text-[20px] sm:text-[22px] tracking-tight text-zinc-900 whitespace-nowrap">Meova</span>
        </div>

        <button
          onClick={() => loginWithGoogleGIS()}
          disabled={loading}
          className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 font-bold text-[12px] sm:text-[13px] transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60 whitespace-nowrap flex-shrink-0"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin text-zinc-400" />
          ) : (
            <svg width={16} height={16} viewBox="0 0 24 24" className="flex-shrink-0">
              <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            </svg>
          )}
          <span className="whitespace-nowrap">Sign in with Google</span>
        </button>
      </header>

      {/* ── 2. HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="relative px-6 lg:px-16 pt-12 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text & CTA */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">

            <h1 className="text-[44px] sm:text-[58px] lg:text-[66px] font-black leading-[1.04] tracking-tight text-zinc-900 mb-6">
              Make your <br />
              <span className="text-[#F05A00]">college count.</span>
            </h1>

            <p className="text-[16px] sm:text-[17px] text-zinc-600 font-medium leading-relaxed mb-8 max-w-[480px]">
              Discover who's live on campus, book instant coffee meets, and earn Sparks through peer-to-peer freelance gigs.
            </p>

            {error && (
              <div className="w-full max-w-[360px] mb-6 px-4 py-3 rounded-2xl text-[13px] font-bold text-red-600 bg-red-50 border border-red-100 shadow-xs">
                {error}
              </div>
            )}

            {/* Google Login CTA Button */}
            <div className="w-full max-w-[360px] space-y-3">
              <button
                onClick={() => loginWithGoogleGIS()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border border-zinc-200/90 bg-white hover:bg-zinc-50 transition-all font-bold text-[15px] text-zinc-800 cursor-pointer active:scale-[0.98] shadow-md shadow-zinc-200/60"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin text-zinc-400" />
                ) : (
                  <svg width={22} height={22} viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>

              <div className="flex items-center justify-start gap-2 text-[12px] font-semibold text-zinc-500 pt-1">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Strictly Encrypted · University Verified</span>
              </div>
            </div>

          </div>

          {/* Right Hero: Campus Radar Widget (Matching Mockup Image Exactly) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[490px] bg-white rounded-[36px] border border-zinc-200/80 shadow-2xl p-6 sm:p-7 space-y-5">
              
              {/* Header: Campus Radar */}
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF4ED] border border-orange-100 text-[#F05A00] flex items-center justify-center">
                    <Compass size={19} />
                  </div>
                  <div>
                    <p className="text-[15px] font-black text-zinc-900 leading-tight">Campus Radar</p>
                    <p className="text-[11px] font-medium text-zinc-400 mt-0.5">Live Activity on Campus</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E6F9F0] rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[11px] font-black text-[#059669] tracking-wider uppercase">LIVE</span>
                </div>
              </div>

              {/* Live Now Student Avatars Row */}
              <div>
                <p className="text-[10.5px] font-black uppercase text-zinc-400 tracking-wider mb-2.5">LIVE NOW</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {/* Aarav */}
                  <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-[#F8F9FA] border border-zinc-100/80">
                    <div className="relative w-11 h-11 rounded-full mb-1.5 border-2 border-[#10B981] p-0.5 bg-white flex-shrink-0">
                      <img src="https://api.dicebear.com/9.x/micah/svg?seed=Aarav&backgroundColor=b6e3f4" alt="Aarav" className="w-full h-full object-cover rounded-full" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white" />
                    </div>
                    <span className="text-[12px] font-black text-zinc-900 leading-tight">Aarav</span>
                    <span className="text-[10px] font-medium text-zinc-400 mt-0.5">GD Subway</span>
                  </div>

                  {/* Diya */}
                  <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-[#F8F9FA] border border-zinc-100/80">
                    <div className="relative w-11 h-11 rounded-full mb-1.5 border-2 border-[#10B981] p-0.5 bg-white flex-shrink-0">
                      <img src="https://api.dicebear.com/9.x/micah/svg?seed=Diya&backgroundColor=ffdfbf" alt="Diya" className="w-full h-full object-cover rounded-full" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white" />
                    </div>
                    <span className="text-[12px] font-black text-zinc-900 leading-tight">Diya</span>
                    <span className="text-[10px] font-medium text-zinc-400 mt-0.5">Library</span>
                  </div>

                  {/* Rehan */}
                  <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-[#F8F9FA] border border-zinc-100/80">
                    <div className="relative w-11 h-11 rounded-full mb-1.5 border-2 border-[#10B981] p-0.5 bg-white flex-shrink-0">
                      <img src="https://api.dicebear.com/9.x/micah/svg?seed=Rehan&backgroundColor=c0aede" alt="Rehan" className="w-full h-full object-cover rounded-full" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white" />
                    </div>
                    <span className="text-[12px] font-black text-zinc-900 leading-tight">Rehan</span>
                    <span className="text-[10px] font-medium text-zinc-400 mt-0.5">Canteen</span>
                  </div>

                  {/* Kavya */}
                  <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-[#F8F9FA] border border-zinc-100/80">
                    <div className="relative w-11 h-11 rounded-full mb-1.5 border-2 border-[#10B981] p-0.5 bg-white flex-shrink-0">
                      <img src="https://api.dicebear.com/9.x/micah/svg?seed=Kavya&backgroundColor=d1d4f9" alt="Kavya" className="w-full h-full object-cover rounded-full" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white" />
                    </div>
                    <span className="text-[12px] font-black text-zinc-900 leading-tight">Kavya</span>
                    <span className="text-[10px] font-medium text-zinc-400 mt-0.5">Block 34</span>
                  </div>
                </div>
              </div>

              {/* Middle Row Cards: Coffee Meet Invite & Gig Reward */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
                
                {/* Coffee Meet Invite */}
                <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-orange-200/70 space-y-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#F05A00] tracking-wider">COFFEE MEET INVITE</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-orange-200 flex-shrink-0">
                      <img src="https://api.dicebear.com/9.x/micah/svg?seed=Diya&backgroundColor=ffdfbf" alt="Diya" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[11.5px] font-black text-zinc-900 leading-tight">Diya wants to meet at GD Subway</p>
                      <p className="text-[9.5px] text-zinc-400 font-medium mt-0.5">2 mins ago</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => loginWithGoogleGIS()}
                    className="w-full py-2 rounded-xl bg-[#F05A00] text-white text-[11px] font-black shadow-2xs hover:bg-[#E04E00] transition-colors cursor-pointer active:scale-95"
                  >
                    Accept Invite
                  </button>
                </div>

                {/* Gig Reward */}
                <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-zinc-200/70 space-y-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">GIG REWARD</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Zap size={14} className="fill-current" />
                    </div>
                    <div>
                      <p className="text-[11.5px] font-black text-zinc-900 leading-tight">Logo Design</p>
                      <p className="text-[9.5px] font-bold text-[#059669] mt-0.5">+250 Sparks from Rehan</p>
                    </div>
                  </div>
                  <div className="w-full py-1.5 rounded-xl bg-[#E6F9F0] text-[#059669] text-[11px] font-black text-center border border-emerald-100">
                    Completed
                  </div>
                </div>

              </div>

              {/* Bottom Row Stats Bar */}
              <div className="pt-3 border-t border-zinc-100 grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 rounded-2xl bg-[#F8F9FA] border border-zinc-100">
                  <p className="text-[16px] font-black text-zinc-900">24</p>
                  <p className="text-[10px] font-medium text-zinc-400">Live Now</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8F9FA] border border-zinc-100">
                  <p className="text-[16px] font-black text-zinc-900">8</p>
                  <p className="text-[10px] font-medium text-zinc-400">Coffee Meets</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8F9FA] border border-zinc-100">
                  <p className="text-[16px] font-black text-[#059669]">₹1,250</p>
                  <p className="text-[10px] font-medium text-zinc-400">Total Earned</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── 3. HOW MEOVA WORKS ON YOUR CAMPUS (3 FEATURE CARDS) ──────────────── */}
      <section className="px-6 lg:px-16 py-20 bg-white border-y border-zinc-200/60 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[30px] sm:text-[42px] font-black tracking-tight text-zinc-900">
              3 simple steps to connect, earn & grow
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-3 relative">
            
            {/* Step 01 Card */}
            <div className="bg-white rounded-3xl border border-orange-200/80 shadow-xs hover:shadow-md p-6 sm:p-7 flex items-center gap-5 relative w-full md:w-1/3 min-h-[170px] group transition-all">
              {/* Floating Orange Step Circle Badge */}
              <div className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-[#F05A00] text-white font-black text-[12px] flex items-center justify-center shadow-md z-20">
                01
              </div>

              {/* Left Circle Icon Container */}
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-[#FFF4ED] border border-orange-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Radio size={32} className="text-[#F05A00]" />
              </div>

              {/* Right Text Content */}
              <div>
                <h3 className="text-[17px] sm:text-[19px] font-black text-zinc-900 mb-1.5 leading-snug">
                  Broadcast Availability
                </h3>
                <p className="text-[12px] sm:text-[13px] text-zinc-500 font-medium leading-relaxed">
                  Toggle "Free Now" to let peers nearby know you're open for coffee or study sessions.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 1 (Desktop: Right Arrow, Mobile: Down Arrow) */}
            <div className="flex items-center justify-center z-10 py-1 md:py-0">
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-orange-200 bg-white text-[#F05A00] shadow-xs hover:scale-110 transition-transform">
                <ArrowRight size={18} />
              </div>
              <div className="flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-orange-200 bg-white text-[#F05A00] shadow-xs my-1">
                <ArrowDown size={16} />
              </div>
            </div>

            {/* Step 02 Card */}
            <div className="bg-white rounded-3xl border border-orange-200/80 shadow-xs hover:shadow-md p-6 sm:p-7 flex items-center gap-5 relative w-full md:w-1/3 min-h-[170px] group transition-all">
              {/* Floating Orange Step Circle Badge */}
              <div className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-[#F05A00] text-white font-black text-[12px] flex items-center justify-center shadow-md z-20">
                02
              </div>

              {/* Left Circle Icon Container */}
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-[#FFF4ED] border border-orange-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase size={32} className="text-[#F05A00]" />
              </div>

              {/* Right Text Content */}
              <div>
                <h3 className="text-[17px] sm:text-[19px] font-black text-zinc-900 mb-1.5 leading-snug">
                  Peer Freelance Gigs
                </h3>
                <p className="text-[12px] sm:text-[13px] text-zinc-500 font-medium leading-relaxed">
                  Post tasks or accept gigs to monetize your skills (photoshoots, UI design, project help).
                </p>
              </div>
            </div>

            {/* Connecting Arrow 2 (Desktop: Right Arrow, Mobile: Down Arrow) */}
            <div className="flex items-center justify-center z-10 py-1 md:py-0">
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-orange-200 bg-white text-[#F05A00] shadow-xs hover:scale-110 transition-transform">
                <ArrowRight size={18} />
              </div>
              <div className="flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-orange-200 bg-white text-[#F05A00] shadow-xs my-1">
                <ArrowDown size={16} />
              </div>
            </div>

            {/* Step 03 Card */}
            <div className="bg-white rounded-3xl border border-orange-200/80 shadow-xs hover:shadow-md p-6 sm:p-7 flex items-center gap-5 relative w-full md:w-1/3 min-h-[170px] group transition-all">
              {/* Floating Orange Step Circle Badge */}
              <div className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-[#F05A00] text-white font-black text-[12px] flex items-center justify-center shadow-md z-20">
                03
              </div>

              {/* Left Circle Icon Container */}
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-[#FFF4ED] border border-orange-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles size={32} className="text-[#F05A00]" />
              </div>

              {/* Right Text Content */}
              <div>
                <h3 className="text-[17px] sm:text-[19px] font-black text-zinc-900 mb-1.5 leading-snug">
                  Earn Sparks & Cash Out
                </h3>
                <p className="text-[12px] sm:text-[13px] text-zinc-500 font-medium leading-relaxed">
                  Accumulate Sparks rewards, cash out directly to UPI, and level up your campus reputation.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 4. BENTO FEATURE SHOWCASE (NEVER EAT LUNCH ALONE) ───────────────── */}
      <section className="px-6 lg:px-16 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Feature Column */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-[32px] sm:text-[42px] font-black tracking-tight text-zinc-900 leading-[1.1]">
              Never eat lunch or study alone again.
            </h2>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 leading-snug">
                  Instant live presence status by location (GD Subway, Library, Canteen, Block 34).
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 leading-snug">
                  1-on-1 coffee booking with verified students.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 leading-snug">
                  Escrow-backed trust and safe campus meetups.
                </span>
              </div>
            </div>
          </div>

          {/* Right Bento Container: Campus Map + Live Activity Split */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[32px] border border-zinc-200/80 shadow-xl p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left Sub-card: Campus Map Radar Stage */}
              <div className="md:col-span-7 bg-[#FFFDF9] rounded-2xl border border-orange-100/90 p-4 sm:p-5 flex flex-col justify-between min-h-[220px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] font-extrabold text-zinc-900 flex items-center gap-1.5">
                    <Compass size={15} className="text-[#F05A00]" /> Campus Map Radar
                  </span>
                  <span className="px-2.5 py-1 bg-[#D1FAE5] text-[#059669] text-[9.5px] font-black tracking-wider rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" /> 3 HOTSPOTS LIVE
                  </span>
                </div>

                <div className="space-y-2.5 my-auto">
                  {/* Hotspot Row 1 */}
                  <div className="bg-white rounded-xl border border-orange-100 p-2.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-500 p-0.5 bg-white flex-shrink-0">
                        <img src="https://api.dicebear.com/9.x/micah/svg?seed=Aarav" alt="Aarav" className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-zinc-900 leading-tight">GD Subway</p>
                        <p className="text-[9.5px] text-emerald-600 font-semibold">Aarav is Free Now</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => loginWithGoogleGIS()}
                      className="px-3 py-1 bg-white border border-orange-200 text-[#F05A00] font-extrabold text-[10.5px] rounded-full cursor-pointer hover:bg-orange-50 active:scale-95 transition-all"
                    >
                      Join Coffee
                    </button>
                  </div>

                  {/* Hotspot Row 2 */}
                  <div className="bg-white rounded-xl border border-orange-100 p-2.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-500 p-0.5 bg-white flex-shrink-0">
                        <img src="https://api.dicebear.com/9.x/micah/svg?seed=Diya" alt="Diya" className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-zinc-900 leading-tight">Central Library</p>
                        <p className="text-[9.5px] text-emerald-600 font-semibold">Diya is studying</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => loginWithGoogleGIS()}
                      className="px-3 py-1 bg-white border border-orange-200 text-[#E05600] font-extrabold text-[10.5px] rounded-full cursor-pointer hover:bg-orange-50 active:scale-95 transition-all"
                    >
                      Study Meet
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Sub-card: Live Campus Activity Feed */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-3 pt-1 md:pt-0">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-extrabold text-zinc-900">Live Campus Activity</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-zinc-100 text-[11.5px]">
                      <p className="font-bold text-zinc-900">Rohan is live at</p>
                      <p className="text-[#F05A00] font-bold">GD Subway <span className="text-zinc-400 font-normal">· 3m ago</span></p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-zinc-100 text-[11.5px]">
                      <p className="font-bold text-zinc-900">Diya booked a coffee</p>
                      <p className="text-[#059669] font-bold">meet at Canteen <span className="text-zinc-400 font-normal">· 5m ago</span></p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-zinc-100 text-[11.5px]">
                      <p className="font-bold text-zinc-900">Aarav posted a gig</p>
                      <p className="text-[#D97706] font-bold">"Photoshoot" <span className="text-zinc-400 font-normal">· 10m ago</span></p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => loginWithGoogleGIS()}
                  className="w-full py-2.5 rounded-xl bg-[#18181B] text-white text-[11.5px] font-black hover:bg-black transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  View all activity
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── 5. UNIVERSITY SAFETY & VERIFICATION BANNER ──────────────────────── */}
      <section className="px-6 lg:px-16 py-10 max-w-7xl mx-auto">
        <div className="bg-[#0a0a0a] text-white p-8 lg:p-12 rounded-[32px] border border-emerald-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex items-start gap-5 max-w-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-[24px] sm:text-[30px] font-black tracking-tight text-white mb-2 leading-snug">
                Built exclusively for verified <span className="text-emerald-400">university students.</span>
              </h3>
              <p className="text-[13px] text-zinc-400 font-medium leading-relaxed">
                Every member is authenticated via official college credentials. Encrypted chats, transparent escrow payouts, and safe campus meetups.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => loginWithGoogleGIS()}
              disabled={loading}
              className="px-6 py-3.5 rounded-full border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 font-bold text-[14px] transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
            >
              <span>Verify & Join Campus</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* ── 6. BOTTOM CTA BANNER ────────────────────────────────────────────── */}
      <footer className="px-6 lg:px-16 pt-16 pb-10 bg-[#F05A00] text-white text-center relative overflow-hidden mt-10">
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          
          <h2 className="text-[34px] sm:text-[46px] font-black tracking-tight text-white leading-tight">
            Ready to own your campus experience?
          </h2>
          
          <p className="text-[15px] text-orange-100 font-medium max-w-xl mx-auto leading-relaxed">
            Join thousands of college students connecting, meeting up, and earning Sparks on Meova today.
          </p>

          <div className="max-w-xs mx-auto pt-2">
            <button
              onClick={() => loginWithGoogleGIS()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-full bg-white hover:bg-orange-50 transition-all font-bold text-[15px] text-zinc-900 cursor-pointer active:scale-[0.98] shadow-xl"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin text-zinc-400" />
              ) : (
                <svg width={20} height={20} viewBox="0 0 24 24">
                  <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                </svg>
              )}
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="pt-10 border-t border-orange-400/40 text-[12px] text-orange-200 font-medium flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Meova" className="h-4 w-4 object-contain filter brightness-0 invert" />
              <span className="font-bold text-white">Meova</span>
            </div>
            <p>© 2026 Meova Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="/terms" target="_blank" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="/privacy" target="_blank" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
