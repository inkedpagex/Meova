'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[GlobalError] Unhandled runtime error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#0a0a0a', color: '#ededed', minHeight: '100dvh', margin: 0, padding: 0 }}>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6 shadow-lg shadow-red-500/5">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
            Fatal Application Error
          </h1>

          <p className="text-sm max-w-md mb-8 text-neutral-400">
            A critical error occurred in the root layout. The details are shown below.
          </p>

          <div className="w-full max-w-xl text-left bg-black border border-neutral-800 rounded-2xl p-5 mb-8 font-mono text-xs overflow-x-auto">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-neutral-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="font-bold text-red-400">Error: {error?.name || 'RuntimeException'}</span>
            </div>
            <p className="text-red-400/90 font-medium mb-3 select-all whitespace-pre-wrap">{error?.message || 'Unknown error details.'}</p>
            {error?.stack && (
              <details className="mt-4">
                <summary className="cursor-pointer text-[10px] text-neutral-500 hover:text-neutral-300 font-sans font-semibold select-none">
                  View full stack trace
                </summary>
                <pre className="mt-2 text-[10px] text-neutral-400 overflow-x-auto leading-normal whitespace-pre-wrap select-all max-h-60 opacity-80">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="flex items-center gap-2 py-3 px-6 text-xs font-bold bg-white text-black rounded-full"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 py-3 px-6 text-xs font-bold bg-neutral-900 text-white rounded-full"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Go to Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
