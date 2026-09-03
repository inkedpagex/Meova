'use client';

import React, { useState } from 'react';
import { Camera, ArrowUpRight } from '@/lib/icons';

const DUMMY_WORDS = [
  'random', 'test', 'temp', 'demo', 'asdf', 'qwerty', 'dummy', 'fake',
  'none', 'null', 'undefined', 'n/a', 'na', 'no', 'user', 'username',
  'insta', 'instagram', 'profile', '12345', '123456', 'abc', 'xyz',
  'string', 'sample', 'test1', 'test2', 'admin'
];

export function isValidInstagram(input) {
  if (!input || typeof input !== 'string') return false;

  const raw = input.trim();
  if (!raw) return false;

  // Extract handle or path
  let clean = raw.toLowerCase()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/^@/, '')
    .split('/')[0]
    .split('?')[0]
    .trim();

  if (!clean || clean.length < 3 || clean.length > 30) return false;
  if (DUMMY_WORDS.includes(clean)) return false;

  // Check valid Instagram handle regex: letters, numbers, periods, underscores
  const INSTA_REGEX = /^[a-zA-Z0-9._]+$/;
  if (!INSTA_REGEX.test(clean)) return false;

  // Cannot start or end with a dot, or have consecutive dots
  if (clean.startsWith('.') || clean.endsWith('.') || clean.includes('..')) return false;

  return true;
}

function InstagramGlyph({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

export default function InstagramEmbed({ instagramInput }) {
  const [hasError, setHasError] = useState(false);

  if (!instagramInput || hasError) return null;
  if (!isValidInstagram(instagramInput)) return null;

  const raw = instagramInput.trim();
  const handle = raw.toLowerCase()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/^@/, '')
    .split('/')[0]
    .split('?')[0]
    .trim();

  const isUrl = raw.startsWith('http://') || raw.startsWith('https://');
  const isPost = isUrl && (raw.includes('/p/') || raw.includes('/reel/'));

  if (!isPost) {
    return (
      <div className="group relative overflow-hidden bg-white border border-zinc-200/90 rounded-[28px] p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.07)] hover:border-zinc-300 transition-all duration-300 flex items-center justify-between gap-3 mb-6">
        {/* Subtle top brand accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] opacity-80 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center gap-3 min-w-0">
          {/* Vibrant Instagram Squircle Badge */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
            <InstagramGlyph className="w-5 h-5 text-white drop-shadow-xs" />
          </div>

          <div className="min-w-0">
            <p className="text-[13px] sm:text-sm font-black text-zinc-950 truncate tracking-tight group-hover:text-zinc-900 transition-colors">
              @{handle}
            </p>
            <p className="text-[10px] sm:text-[10.5px] font-bold text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <span>Instagram</span>
              <span>•</span>
              <span>Student Profile</span>
            </p>
          </div>
        </div>

        {/* High-Contrast Action Button */}
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-full bg-zinc-950 hover:bg-gradient-to-r hover:from-[#e1306c] hover:to-[#c13584] text-white text-[11px] sm:text-xs font-black tracking-wide shadow-xs hover:shadow-md active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
        >
          <span>View on Instagram</span>
          <ArrowUpRight size={14} strokeWidth={2.5} />
        </a>
      </div>
    );
  }

  const embedUrl = `${raw.replace(/\/$/, '')}/embed/`;

  return (
    <div className="rounded-[28px] p-5 mb-6 bg-white border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white">
            <InstagramGlyph className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Instagram Vibe</span>
        </h3>
        <a 
          href={raw} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1 text-[11px] font-black text-zinc-700 hover:text-[#e1306c] transition-colors"
        >
          <span>Open in App</span>
          <ArrowUpRight size={13} strokeWidth={2.5} />
        </a>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 h-[480px]">
        <iframe
          src={embedUrl}
          className="w-full h-full border-none"
          allowFullScreen
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
}
