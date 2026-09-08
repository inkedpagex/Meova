'use client';

import { useEffect, useState } from 'react';

/**
 * PWALaunchSplash
 * 
 * Shows the pure white background + centered Meova logo splash ONLY:
 * 1. When the app is launched in installed PWA standalone mode (or ?source=pwa).
 * 2. Exactly once per launch session.
 * 
 * It NEVER renders for standard web browsing, desktop tabs, or page navigations.
 */
export default function PWALaunchSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        new URLSearchParams(window.location.search).get('source') === 'pwa';

      // If not launched as an installed PWA, do NOT render anything
      if (!isStandalone) return;

      // Only show once per app launch session
      const alreadyShown = sessionStorage.getItem('__meova_pwa_splash_shown');
      if (!alreadyShown) {
        sessionStorage.setItem('__meova_pwa_splash_shown', '1');
        setVisible(true);

        const timer = setTimeout(() => {
          setVisible(false);
        }, 750);

        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore potential sessionStorage exceptions in private browsing
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      id="meova-pwa-splash"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        animation: 'meovaSplashFadeOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.45s forwards',
      }}
    >
      <img
        src="/logo.png"
        alt="Meova"
        width={76}
        height={50}
        style={{
          width: '76px',
          height: 'auto',
          maxHeight: '52px',
          objectFit: 'contain',
          userSelect: 'none',
        }}
      />
    </div>
  );
}
