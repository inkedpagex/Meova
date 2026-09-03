import React from 'react';
import { Ban } from '@/lib/icons';

export const metadata = {
  title: 'Access Restricted | Meova',
};

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      {/* Meova Logo */}
      <div className="mb-8 flex items-center gap-2">
        <img src="/icon-192.png" alt="Meova" className="w-8 h-8 object-contain" />
        <span className="text-2xl font-black tracking-tight text-zinc-900">
          Meova
        </span>
      </div>

      <div className="max-w-md w-full bg-white border border-red-100 rounded-[2rem] p-8 text-center shadow-lg shadow-red-500/5">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Ban size={40} className="stroke-[2.5]" />
        </div>
        
        <h1 className="text-3xl font-black text-zinc-900 mb-3 tracking-tight">
          Account Restricted
        </h1>
        
        <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
          Your access to the platform has been revoked due to violations of our community guidelines. 
          If you believe this is a mistake, please contact support.
        </p>

        <a 
          href="mailto:support@meova.in" 
          className="inline-flex items-center justify-center w-full py-4 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-2xl transition-colors shadow-md shadow-red-500/20 active:scale-[0.98]"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
