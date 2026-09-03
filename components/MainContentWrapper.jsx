'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import GenderPromptModal from './GenderPromptModal';

export default function MainContentWrapper({ children }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');
  const isMessagesPath = pathname?.startsWith('/messages');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);

    const handleToggle = (e) => {
      setIsCollapsed(!!e.detail?.collapsed);
    };

    window.addEventListener('sidebar-collapsed-change', handleToggle);
    return () => window.removeEventListener('sidebar-collapsed-change', handleToggle);
  }, []);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  if (isAdminPath) {
    return (
      <div className={`flex-1 ${isCollapsed ? 'md:pl-[72px]' : 'md:pl-[230px]'} min-w-0 bg-[#f8fafc] transition-all duration-300`}>
        <main className="p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto pb-safe">
          {children}
        </main>
        <GenderPromptModal user={currentUser} />
      </div>
    );
  }

  const isStandalonePath =
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/offline' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/gla-university' ||
    pathname?.startsWith('/gla-university');

  if (isStandalonePath) {
    return (
      <div className="flex-1 min-w-0 bg-white">
        <main className="w-full h-full">
          {children}
        </main>
      </div>
    );
  }

  const leftPlClass = isCollapsed ? 'md:pl-[72px]' : 'md:pl-[240px]';

  return (
    <div className={`flex-1 ${leftPlClass} ${isMessagesPath ? '' : 'xl:pr-[320px]'} min-w-0 transition-all duration-300`}>
      <main
        className={`w-full mx-auto ${
          isMessagesPath 
            ? 'p-0 md:p-6 md:!pt-6 md:!pb-12 max-w-full' 
            : 'max-w-[720px] px-4 pt-6 pb-12 pb-safe'
        }`}
      >
        {children}
      </main>
      <GenderPromptModal user={currentUser} />
    </div>
  );
}
