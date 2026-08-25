'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MainContentWrapper({ children }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');
  const isMessagesPath = pathname?.startsWith('/messages');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);

    const handleToggle = (e) => {
      setIsCollapsed(!!e.detail?.collapsed);
    };

    window.addEventListener('sidebar-collapsed-change', handleToggle);
    return () => window.removeEventListener('sidebar-collapsed-change', handleToggle);
  }, []);

  if (isAdminPath) {
    return (
      <div className={`flex-1 ${isCollapsed ? 'md:pl-[72px]' : 'md:pl-[230px]'} min-w-0 bg-[#f8fafc] transition-all duration-300`}>
        <main className="p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto pb-safe">
          {children}
        </main>
      </div>
    );
  }

  const isStandalonePath = pathname === '/terms' || pathname === '/privacy';

  if (isStandalonePath) {
    return (
      <div className="flex-1 min-w-0 bg-white">
        <main className="w-full h-full">
          {children}
        </main>
      </div>
    );
  }

  const leftPlClass = isCollapsed ? 'md:pl-[72px]' : 'md:pl-[230px]';

  return (
    <div className={`flex-1 ${leftPlClass} ${isMessagesPath ? '' : 'xl:pr-[320px]'} min-w-0 transition-all duration-300`}>
      <main
        className={`w-full mx-auto ${
          isMessagesPath 
            ? 'p-0 md:p-6 md:!pt-8 md:!pb-8 max-w-full' 
            : 'max-w-4xl lg:max-w-5xl px-2 sm:px-4 md:px-8 pt-16 md:!pt-8 pb-24 md:!pb-8 pb-safe'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
