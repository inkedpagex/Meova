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
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#f8fafc] px-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="relative mb-6 group">
          <div className="absolute inset-0 bg-[#F05A00]/20 blur-xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-700" />
          <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center relative border border-zinc-100 rotate-[-5deg] group-hover:rotate-0 transition-all duration-300">
            <WifiOff size={40} className="text-[#F05A00] stroke-[2.5]" />
          </div>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mb-2">
          You're Offline
        </h1>
        <p className="text-sm font-semibold text-zinc-500 max-w-xs mb-8">
          Check your Wi-Fi or cellular data connection to continue using Meetuply.
        </p>

        <button 
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-6 py-3.5 bg-[#F05A00] hover:bg-[#D94F00] text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-[#F05A00]/30"
        >
          <RefreshCw size={18} className={isRetrying ? "animate-spin" : ""} strokeWidth={2.5} />
          {isRetrying ? 'Checking...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return children;
}
