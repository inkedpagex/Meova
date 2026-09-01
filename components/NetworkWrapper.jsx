'use client';
import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function NetworkWrapper({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
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
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
      }
      setIsRetrying(false);
    }, 800);
  };

  if (!isOnline) {
    return (
      <main className="fixed inset-0 z-[99999] min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300 overflow-y-auto">
        {/* Background ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div className="w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl" />
          <div className="w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-2xl translate-y-24" />
        </div>

        <div className="relative w-full max-w-md bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-center space-y-6">
          
          {/* Animated Icon Card */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#F05A00]/15 rounded-2xl blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-orange-50 to-white border border-orange-200/80 rounded-2xl flex items-center justify-center shadow-md rotate-[-3deg] hover:rotate-0 transition-transform duration-300">
              <WifiOff size={36} className="text-[#F05A00] stroke-[2.2]" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white" />
            </span>
          </div>

          {/* Heading & Status */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100/80 text-[10.5px] font-black uppercase tracking-wider text-[#F05A00]">
              <span className="w-2 h-2 rounded-full bg-[#F05A00] animate-pulse" />
              <span>Connection Interrupted</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              You're Offline
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Please check your campus Wi-Fi or mobile cellular network to reconnect to Meova.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full py-4 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F05A00]/25 active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} strokeWidth={2.5} />
              <span>{isRetrying ? 'Checking Network...' : 'Try Reconnecting'}</span>
            </button>
          </div>

          {/* Footer Brand Tag */}
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pt-2">
            Meova Campus Social Platform
          </p>
        </div>
      </main>
    );
  }

  return children;
}
