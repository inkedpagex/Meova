// Client-side interactive Logout button.
'use client';

import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from '@/lib/icons';

export default function LogoutButton() {
  const router = useRouter();
  const { logOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogOut = async () => {
    setLoggingOut(true);
    try {
      await logOut();
    } catch (e) {
      console.warn('Logout error', e);
    }

    // Client-side cleanup of local storage & cookies
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // Clear non-httpOnly cookies
        document.cookie.split(';').forEach((c) => {
          const name = c.split('=')[0].trim();
          document.cookie = `${name}=; Path=/; Domain=.meova.in; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          document.cookie = `${name}=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
      }
    } catch {}

    const isProd = process.env.NODE_ENV === 'production';
    const cleanHost = typeof window !== 'undefined' ? window.location.host.replace(/^(app|admin|ambassador)\./, '') : 'localhost:3000';
    const rootBase = isProd ? 'https://meova.in' : `http://${cleanHost}`;
    window.location.href = `${rootBase}/login`;
  };

  return (
    <button
      onClick={handleLogOut}
      disabled={loggingOut}
      className="flex items-center gap-1.5 text-xs text-rose-500 font-bold hover:text-rose-600 transition-all cursor-pointer disabled:opacity-50"
    >
      {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
      Log Out
    </button>
  );
}
