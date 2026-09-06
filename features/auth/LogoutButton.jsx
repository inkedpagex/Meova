// Client-side interactive Logout button.
'use client';

import React from 'react';
import { useAuth } from './useAuth';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from '@/lib/icons';

export default function LogoutButton() {
  const router = useRouter();
  const { loading, logOut } = useAuth();

  const handleLogOut = async () => {
    const res = await logOut();
    if (res.success) {
      const isProd = process.env.NODE_ENV === 'production';
      const cleanHost = typeof window !== 'undefined' ? window.location.host.replace(/^(app|admin|ambassador)\./, '') : 'localhost:3000';
      const rootBase = isProd ? 'https://meova.in' : `http://${cleanHost}`;
      window.location.href = `${rootBase}/login`;
    }
  };

  return (
    <button
      onClick={handleLogOut}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-red-500 font-bold hover:text-red-400 transition-all cursor-pointer disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
      Log Out
    </button>
  );
}
