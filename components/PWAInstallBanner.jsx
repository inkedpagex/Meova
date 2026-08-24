'use client';
/**
 * PWAInstallBanner.jsx
 * Smart, mobile-first "Install App" banner.
 * - Appears only when browser fires `beforeinstallprompt` (Chrome/Edge/Android)
 * - On iOS shows a manual "Add to Home Screen" tip sheet
 * - Dismissed state is persisted in localStorage (never bothers user again)
 * - Renders nothing on desktop browsers that don't support PWA install
 */
import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

const DISMISSED_KEY = 'meetuply_pwa_dismissed';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // assume installed until we know

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't show if already installed (running as PWA)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Don't show if user dismissed before
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;

    // iOS detection (Safari doesn't fire beforeinstallprompt)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      // Show after 2s delay to avoid jarring first-load feel
      const t = setTimeout(() => {
        setShowIOSTip(true);
        setVisible(true);
      }, 2000);
      return () => clearTimeout(t);
    }

    // Chrome / Android / Edge: listen for native install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (isStandalone || !visible) return null;

  // ── iOS tip sheet ──────────────────────────────────────────────────────────
  if (showIOSTip) {
    return (
      <div
        className="fixed bottom-20 left-3 right-3 md:left-auto md:right-8 md:bottom-8 md:w-[400px] z-50 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #1a0a14 0%, #2d1025 100%)',
          border: '1px solid rgba(140,53,115,0.4)',
          animation: 'slideUpBanner 0.35s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <style>{`
          @keyframes slideUpBanner {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8C3573] to-[#b5609d] flex items-center justify-center shadow-lg flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm">Install Meetuply</p>
                <p className="text-purple-300 text-[11px] font-medium">Get the full app experience</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-1 text-zinc-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="bg-white/5 rounded-xl p-3 space-y-2">
            <p className="text-zinc-300 text-[12px] font-semibold">To install on your iPhone:</p>
            <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
              <span className="w-5 h-5 rounded-full bg-[#8C3573] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
              <span>Tap the <Share size={12} className="inline text-blue-400" /> <strong className="text-white">Share</strong> button in Safari</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
              <span className="w-5 h-5 rounded-full bg-[#8C3573] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
              <span>Scroll down and tap <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong></span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
              <span className="w-5 h-5 rounded-full bg-[#8C3573] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
              <span>Tap <strong className="text-white">Add</strong> — done! 🎉</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Android / Chrome native prompt ─────────────────────────────────────────
  return (
    <div
      className="fixed bottom-20 left-3 right-3 md:left-auto md:right-8 md:bottom-8 md:w-[400px] z-50 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #1a0a14 0%, #2d1025 100%)',
        border: '1px solid rgba(140,53,115,0.4)',
        animation: 'slideUpBanner 0.35s cubic-bezier(.22,1,.36,1)',
      }}
    >
      <style>{`
        @keyframes slideUpBanner {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8C3573] to-[#b5609d] flex items-center justify-center shadow-lg flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 18V9l9 6 9-6v9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 9l9-6 9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm">Install Meetuply</p>
          <p className="text-purple-300 text-[11px] font-medium truncate">Faster & works offline</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-[#8C3573] text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl active:scale-95 transition-all"
          >
            <Download size={12} />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
