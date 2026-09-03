import React from 'react';
import { Ban } from '@/lib/icons';

export const metadata = {
  title: 'Access Restricted | Meova',
};

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-4">
      {/* Meova Logo */}
      <div className="mb-8 flex items-center gap-2">
        <img src="/icon-192.png" alt="Meova" className="w-8 h-8 object-contain" />
        <span className="text-2xl font-bold tracking-tight text-[#1C1917]">
          Meova
        </span>
      </div>

      <div className="max-w-md w-full bg-white border border-[#E7E5E4] rounded-[20px] p-8 text-center shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full mx-auto flex items-center justify-center mb-6 border border-rose-100">
          <Ban size={32} className="stroke-[2.5]" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#1C1917] mb-3 tracking-tight">
          Account Restricted
        </h1>
        
        <p className="text-[#78716C] text-sm font-medium leading-relaxed mb-8">
          Your access to the platform has been revoked due to violations of our community guidelines. 
          If you believe this is a mistake, please contact support.
        </p>

        <a 
          href="mailto:support@meova.in" 
          className="inline-flex items-center justify-center w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs uppercase tracking-wider font-bold rounded-full transition-colors shadow-xs active:scale-[0.98]"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
