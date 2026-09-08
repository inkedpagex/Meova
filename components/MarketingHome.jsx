'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/features/auth/useAuth';
import LegalFooter from './LegalFooter';
import { slugifyCollege } from '@/lib/collegeSlug';
import {
  Sparkles,
  Compass,
  Users,
  Coffee,
  ShieldCheck,
  Search,
  ArrowRight,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Lock,
  Clock,
  Loader2,
  ChevronRight,
  Building2,
} from '@/lib/icons';

export default function MarketingHome({ colleges = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { loading, logInWithGoogle } = useAuth();
  const [authError, setAuthError] = useState(null);

  const loginWithGoogleGIS = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAuthError(null);
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
          window.location.href = appBase;
        }
      } else if (res?.error) {
        setAuthError(res.error.message || 'Google sign-in failed. Please try again.');
      }
    },
    onError: () => {
      setAuthError('Google sign-in failed. Please try again.');
    },
  });

  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) {
      return colleges.slice(0, 12);
    }
    const q = searchQuery.toLowerCase().trim();
    return colleges.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
    );
  }, [colleges, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#F1EEFB] selection:text-[#7657D9]">
      {/* ── 1. STICKY TOP NAVBAR ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img 
              src="/logo.png" 
              alt="Meova Logo" 
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-black/60 tracking-wider uppercase">Campuses</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-black/70">
            <a href="#colleges" className="hover:text-black transition-colors">
              Find Your Campus
            </a>
            <a href="#features" className="hover:text-black transition-colors">
              Features
            </a>
            <Link href="/ambassador" className="hover:text-black transition-colors">
              Ambassadors
            </Link>
            <Link href="/about" className="hover:text-black transition-colors">
              About
            </Link>
            <Link href="/help" className="hover:text-black transition-colors">
              Help
            </Link>
            <Link href="/blog" className="hover:text-black transition-colors">
              Blog
            </Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold text-black/80 hover:text-black hover:bg-black/5 transition-all whitespace-nowrap"
            >
              Log In
            </Link>

            <button
              onClick={() => loginWithGoogleGIS()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white hover:bg-black/5 text-black border border-black/15 text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin text-black/70" />
              ) : (
                <svg width={14} height={14} viewBox="0 0 24 24" className="flex-shrink-0">
                  <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                </svg>
              )}
              <span>Join with Google</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── 2. HERO SECTION ─────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center sm:text-left">
            
            {/* Live Campus Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 text-[#1C1917] border border-black/10 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live across {colleges.length > 0 ? `${colleges.length}+` : 'Leading'} Indian Campuses</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-black leading-[1.05]">
              Make your college <br />
              <span className="text-[#7657D9]">experience count.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-black/70 font-medium leading-relaxed max-w-2xl mx-auto sm:mx-0">
              The verified social network and peer meetup ecosystem for Indian university students. Discover who is free on campus right now, book instant coffee meets, and join verified student circles.
            </p>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {authError}
              </div>
            )}

            {/* Dual CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 pt-2">
              <button
                onClick={() => loginWithGoogleGIS()}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-black hover:bg-black/80 text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" className="flex-shrink-0">
                  <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                </svg>
                <span>Join with Google</span>
              </button>

              <a
                href="#colleges"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white hover:bg-black/5 text-black border border-black/15 font-bold text-sm transition-all whitespace-nowrap"
              >
                <span>Explore Campuses</span>
                <ArrowRight size={15} />
              </a>
            </div>

            {/* Terms notice */}
            <p className="text-[11.5px] leading-relaxed text-black/60 text-center sm:text-left pt-1 font-medium">
              By signing in, you are accepting our{' '}
              <Link href="/terms" target="_blank" className="font-bold text-black/80 hover:text-black underline">
                Terms of Service
              </Link>
              ,{' '}
              <Link href="/privacy" target="_blank" className="font-bold text-black/80 hover:text-black underline">
                Privacy Policy
              </Link>
              , and{' '}
              <Link href="/community-guidelines" target="_blank" className="font-bold text-black/80 hover:text-black underline">
                Community Guidelines
              </Link>
              .
            </p>

            {/* Safety Micro-label */}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-black/60 pt-0.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>100% University Verified · Encrypted · Made for Indian Students</span>
            </div>

          </div>

          {/* Right Hero: Official Verified Campus Pass & Ecosystem Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[480px] bg-white rounded-[32px] border border-black/10 shadow-2xl p-6 sm:p-7 space-y-4 font-inter text-black">
              
              {/* Official Campus Pass Header */}
              <div className="bg-[#1C1917] rounded-[24px] p-5 text-white shadow-lg border border-black/20 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1.5">
                    <GraduationCap size={14} />
                    <span>Official Campus Pass</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Network</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-0.5">
                  <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs">
                    <ShieldCheck size={22} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white leading-tight">Verified Student Hub</p>
                    <p className="text-[11px] text-white/80 font-medium">Campus-Locked • Zero Outside Strangers</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-white/15 text-[10px] font-bold text-white/90">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs">Roll No. Verified</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs">100% Student-Only</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs">Encrypted Gate</span>
                </div>
              </div>

              {/* Three Value Proposition Tiles */}
              <div className="space-y-2.5">
                {/* 1-on-1 Peer Meets */}
                <div className="p-3.5 rounded-2xl bg-[#FAFAF8] border border-black/10 hover:border-black/30 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Coffee size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-black">1-on-1 Peer Meets</p>
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">Safe Spots</span>
                    </div>
                    <p className="text-[11px] font-semibold text-black/70 leading-snug">
                      Schedule verified coffee chats and study sessions at official campus cafes and library lawns.
                    </p>
                  </div>
                </div>

                {/* Campus Circles */}
                <div className="p-3.5 rounded-2xl bg-[#FAFAF8] border border-black/10 hover:border-black/30 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black/5 text-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-black">Student-Run Campus Circles</p>
                      <span className="text-[9px] font-bold text-black/70 bg-black/5 px-2 py-0.5 rounded-full">Self-Governed</span>
                    </div>
                    <p className="text-[11px] font-semibold text-black/70 leading-snug">
                      Join campus clubs for hackathons, coding squads, design cohorts, and placement preparation.
                    </p>
                  </div>
                </div>

                {/* Live Campus Presence */}
                <div className="p-3.5 rounded-2xl bg-[#FAFAF8] border border-black/10 hover:border-black/30 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Compass size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-black">Real-Time Campus Presence</p>
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">2-Hr Auto Expiry</span>
                    </div>
                    <p className="text-[11px] font-semibold text-black/70 leading-snug">
                      Broadcast when you are free on campus. Zero continuous background GPS tracking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Action CTA */}
              <button
                onClick={() => loginWithGoogleGIS()}
                className="w-full py-3.5 rounded-2xl bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#7657D9]/12 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <span>Unlock Your Campus Pass</span>
                <ArrowRight size={14} />
              </button>

              {/* Guarantee Metrics Bar */}
              <div className="pt-2 border-t border-black/10 grid grid-cols-3 text-center">
                <div>
                  <p className="text-xs font-black text-black">100%</p>
                  <p className="text-[9px] font-bold text-black/50 uppercase tracking-wider">Verified IDs</p>
                </div>
                <div>
                  <p className="text-xs font-black text-black">Zero</p>
                  <p className="text-[9px] font-bold text-black/50 uppercase tracking-wider">Outside Strangers</p>
                </div>
                <div>
                  <p className="text-xs font-black text-black">7 Days</p>
                  <p className="text-[9px] font-bold text-black/50 uppercase tracking-wider">Chat Expiry</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── 3. EXPLORE CAMPUSES DIRECTORY ─────────────────────────────── */}
      <section id="colleges" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/10">
        <div className="space-y-4 text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/5 text-[#1C1917] border border-black/10 text-xs font-bold uppercase tracking-wider">
            <GraduationCap size={14} />
            <span>Campus Network Directory</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Find your university community.
          </h2>
          <p className="text-sm sm:text-base text-black/70 font-medium leading-relaxed">
            Every university has an official branded hub on Meova with verified student rosters, campus circles, and student ambassadors.
          </p>

          {/* Interactive Search Box */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your college (e.g. DTU, DU, Bennett, IIT, VIT)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-black/15 text-sm font-medium text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-xs placeholder:text-black/35 transition-all"
            />
          </div>
        </div>

        {/* College Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredColleges.map((college) => {
            const slug = slugifyCollege(college.name);
            return (
              <Link
                key={college.id}
                href={`/college/${slug}`}
                className="group p-6 rounded-[26px] bg-white border border-black/10 hover:border-black/30 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-black bg-black/5 px-2.5 py-0.5 rounded-full">
                      <Building2 size={11} />
                      <span>{college.city || 'Campus Hub'}</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  <h3 className="text-base font-black text-black group-hover:text-black/80 transition-colors line-clamp-2">
                    {college.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs font-bold text-black/60 group-hover:text-black transition-colors">
                  <span>View Campus Hub</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-black/40 group-hover:text-black" />
                </div>
              </Link>
            );
          })}
        </div>

        {filteredColleges.length === 0 && (
          <div className="text-center py-12 p-8 rounded-[26px] bg-white border border-black/10 space-y-3">
            <Building2 size={32} className="mx-auto text-black/30" />
            <p className="text-sm font-bold text-black">No college found matching "{searchQuery}"</p>
            <p className="text-xs text-black/60 max-w-md mx-auto">
              Want to launch Meova at your college? Apply as a founding Campus Ambassador and bring your university live.
            </p>
            <Link
              href="/ambassador"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#7657D9] text-white text-xs font-bold hover:bg-[#6848C9] active:bg-[#5B3FB3] transition-all cursor-pointer"
            >
              <span>Apply as Ambassador</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </section>

      {/* ── 4. FOUR CORE FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/10">
        <div className="space-y-4 text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/5 text-[#1C1917] border border-black/10 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Built for In-Person Campus Life</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Everything your campus experience was missing.
          </h2>
          <p className="text-sm sm:text-base text-black/70 font-medium leading-relaxed">
            Meova replaces anonymous doomscrolling with real-world student connections, peer collaborations, and safe meetups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1 */}
          <div className="p-7 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-black/5 text-black flex items-center justify-center">
              <Compass size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-black">Campus Radar</h3>
              <p className="text-xs text-black/70 font-medium leading-relaxed">
                Broadcast when you're hanging out at the canteen or studying in the library. See who is free right now without creepy GPS tracking.
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">Live &amp; Ephemeral</span>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coffee size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-black">1-on-1 Coffee Meets</h3>
              <p className="text-xs text-black/70 font-medium leading-relaxed">
                Send instant coffee invites to verified classmates. All meetups take place strictly at approved, well-lit campus spots.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">High Trust Meets</span>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-black">Campus Circles</h3>
              <p className="text-xs text-black/70 font-medium leading-relaxed">
                Join student-led tech communities, hackathon squads, open mic societies, and placement study groups without institutional gatekeeping.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Self-Organized</span>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-black/5 text-black flex items-center justify-center">
              <Lock size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-black">Privacy First</h3>
              <p className="text-xs text-black/70 font-medium leading-relaxed">
                Direct chats automatically self-destruct after 7 days. Encrypted student roll verification eliminates outside strangers and trolls.
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">7-Day Auto Purge</span>
          </div>
        </div>
      </section>

      {/* ── 5. SAFETY & STATUTORY COMPLIANCE BANNER ───────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[32px] bg-white border border-[#E7E5E4] text-[#1C1917] shadow-sm space-y-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>India IT Rules 2021 Compliant</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C1917] leading-tight">
              Safety, Privacy &amp; Accountability at Every Step.
            </h3>
            <p className="text-xs sm:text-sm text-[#78716C] font-medium leading-relaxed">
              We enforce strict community standards: campus-only meetups, designated Grievance Redressal Officer with 24-hr response SLA, and zero tolerance for impersonation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
            <Link
              href="/community-guidelines"
              className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#1C1917] text-white text-xs font-bold hover:bg-black transition-all text-center whitespace-nowrap shadow-xs"
            >
              Read Guidelines
            </Link>
            <Link
              href="/grievance"
              className="w-full sm:w-auto px-5 py-3 rounded-full bg-white text-[#1C1917] text-xs font-bold hover:bg-black/5 transition-all border border-[#E7E5E4] text-center whitespace-nowrap"
            >
              Grievance Redressal
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. CAMPUS AMBASSADOR CALLOUT ───────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[32px] bg-black text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl border border-white/10">
          <div className="space-y-3 text-center lg:text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/80 bg-white/15 px-3 py-1 rounded-full inline-block">
              Campus Leadership
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Become a Meova Campus Ambassador
            </h3>
            <p className="text-sm text-white/80 font-medium max-w-xl">
              Lead the verified student community at your university, organize exclusive college meets, earn Sparks, and receive official certificates.
            </p>
          </div>

          <Link
            href="/ambassador"
            className="flex-shrink-0 px-8 py-4 rounded-full bg-white text-black font-black text-xs sm:text-sm hover:bg-white/90 transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            Apply for Your Campus →
          </Link>
        </div>
      </section>

      {/* ── 7. COMPREHENSIVE LEGAL FOOTER ──────────────────────────────── */}
      <LegalFooter />
    </div>
  );
}
