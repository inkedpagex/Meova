'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Radio, Sparkles, ShieldCheck, Home } from '@/lib/icons';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      window.location.href = '/';
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setIsOnline(true);
        window.location.href = '/';
      } else {
        setIsRetrying(false);
      }
    }, 1000);
  };

  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8] flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-[#6D28D9]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white border border-[#E7E5E4] rounded-[20px] p-6 sm:p-8 shadow-xs text-center space-y-6">
        
        {/* Animated Icon Card */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="relative w-20 h-20 bg-[#F3EEFC] border border-[#E4D9F7]/80 rounded-2xl flex items-center justify-center shadow-2xs">
            <WifiOff size={36} className="text-[#6D28D9] stroke-[2.2]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white" />
          </span>
        </div>

        {/* Heading & Status */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEFC] border border-[#E4D9F7]/80 text-[10.5px] font-bold uppercase tracking-wider text-[#6D28D9]">
            <Radio size={12} className="animate-pulse" />
            <span>Connection Interrupted</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            You're Offline
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#78716C] max-w-xs mx-auto leading-relaxed">
            We couldn't connect to the campus server. Please check your mobile data or campus Wi-Fi.
          </p>
        </div>

        {/* Info Pill */}
        <div className="bg-[#F3EEFC] border border-[#E4D9F7]/80 rounded-2xl p-3.5 text-left flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-[#6D28D9] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11.5px] font-bold text-[#1C1917] leading-tight">
              Safe &amp; Protected: <span className="font-medium text-[#78716C]">Your wallet balance, Sparks, and bookings are completely secure.</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full py-3.5 px-6 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} strokeWidth={2.5} />
            <span>{isRetrying ? 'Checking Network...' : 'Try Reconnecting'}</span>
          </button>

          <Link
            href="/"
            className="w-full py-3 px-6 rounded-full bg-white hover:bg-[#F3EEFC] text-black border border-black/[0.08] font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Home size={14} />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Footer Brand Tag */}
        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest pt-2">
          Meova Campus Social Platform
        </p>
      </div>
    </main>
  );
}
