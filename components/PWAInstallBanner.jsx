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
import { Download, X, Share } from '@/lib/icons';
import Logo from './Logo';

const DISMISSED_KEY = 'Meova_pwa_dismissed';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Strictly show ONLY on app.meova.in (or app.localhost in local development)
    const hostname = window.location.hostname;
    const isAppHost = hostname === 'app.meova.in' || hostname.startsWith('app.');
    if (!isAppHost) return;

    // Do not show on auth pages
    const pathname = window.location.pathname;
    if (pathname === '/login' || pathname === '/signup') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    if (localStorage.getItem(DISMISSED_KEY) === '1') return;


    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      const t = setTimeout(() => {
        setShowIOSTip(true);
        setVisible(true);
      }, 2000);
      return () => clearTimeout(t);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPWAInstallPrompt = e; // Expose globally for manual trigger
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
    window.deferredPWAInstallPrompt = null;
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (isStandalone || !visible) return null;

  // iOS tip sheet
  if (showIOSTip) {
    return (
      <div
        className="fixed bottom-20 left-3 right-3 md:left-auto md:right-8 md:bottom-8 md:w-[400px] z-50 rounded-[16px] overflow-hidden shadow-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]"
        style={{
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
              <Logo size="sm" />
              <div>
                <p className="text-[var(--text-primary)] font-bold text-sm">Install Meova</p>
                <p className="text-[var(--text-secondary)] text-[11px] font-medium">Get the full app experience</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-xl p-3 space-y-2">
            <p className="text-[var(--text-secondary)] text-[12px] font-semibold">To install on your iPhone:</p>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[11px]">
              <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
              <span>Tap the <Share size={12} className="inline text-[var(--accent)]" /> <strong className="text-[var(--text-primary)]">Share</strong> button in Safari</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[11px]">
              <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
              <span>Scroll down and tap <strong className="text-[var(--text-primary)]">&ldquo;Add to Home Screen&rdquo;</strong></span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[11px]">
              <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
              <span>Tap <strong className="text-[var(--text-primary)]">Add</strong> — done!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome native prompt
  return (
    <div
      className="fixed bottom-20 left-3 right-3 md:left-auto md:right-8 md:bottom-8 md:w-[400px] z-50 rounded-[16px] overflow-hidden shadow-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]"
      style={{
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
        <Logo size="sm" />

        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] font-bold text-sm">Install Meova</p>
          <p className="text-[var(--text-secondary)] text-[11px] font-medium truncate">Faster &amp; works offline</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <Download size={12} />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
