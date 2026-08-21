'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function MainContentWrapper({ children }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');
  const isMessagesPath = pathname?.startsWith('/messages');

  if (isAdminPath) {
    return (
      <div className="flex-1 md:pl-[220px] min-w-0 bg-[#f8fafc]">
        <main className="p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto pb-safe">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex-1 md:pl-[220px] ${isMessagesPath ? '' : 'xl:pr-[320px]'} min-w-0`}>
      <main
        style={{
          maxWidth: isMessagesPath ? 1200 : 640,
          margin: '0 auto',
          padding: '16px 16px 88px',
          paddingTop: 68
        }}
        className="md:!pt-8 md:!pb-8 md:px-6 pb-safe"
      >
        {children}
      </main>
    </div>
  );
}
