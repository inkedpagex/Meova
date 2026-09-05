'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on pathname / searchParams change
  useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Listen to global navigation clicks
  useEffect(() => {
    const handleNavigationStart = (e) => {
      const target = e.target.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('#') &&
        !target.getAttribute('target') &&
        href !== pathname
      ) {
        setLoading(true);
        setProgress(30);
        setTimeout(() => setProgress(70), 100);
      }
    };

    window.addEventListener('click', handleNavigationStart, { capture: true });
    return () => window.removeEventListener('click', handleNavigationStart, { capture: true });
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[2.5px] pointer-events-none bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-[#FF7A00] to-[var(--accent)] shadow-[0_0_8px_rgba(240,90,0,0.8)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 150ms ease-out, opacity 200ms ease-out 100ms' : 'width 250ms cubic-bezier(0.1, 0.9, 0.2, 1)',
        }}
      />
    </div>
  );
}
