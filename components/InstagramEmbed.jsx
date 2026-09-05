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
      <div className="group relative overflow-hidden bg-white border border-[#E7E5E4] rounded-2xl p-3.5 sm:p-4 shadow-xs hover:border-black/[0.1] transition-all duration-200 flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          {/* Clean Single-Accent Badge */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)]/80 text-[var(--accent)] flex items-center justify-center shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
            <InstagramGlyph className="w-5 h-5 text-[var(--accent)]" />
          </div>

          <div className="min-w-0">
            <p className="text-[13px] sm:text-sm font-bold text-[#1C1917] truncate tracking-tight">
              @{handle}
            </p>
            <p className="text-[10.5px] font-bold text-[#1C1917]/60 mt-0.5 flex items-center gap-1.5">
              <span>Instagram</span>
              <span>•</span>
              <span>Student Profile</span>
            </p>
          </div>
        </div>

        {/* Neo-Minimalist Pill Action Button */}
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-full bg-white hover:bg-[var(--accent-tint-10)] text-[#1C1917] border border-[#E7E5E4] text-xs font-bold tracking-wide shadow-xs active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
        >
          <span>View on Instagram</span>
          <ArrowUpRight size={14} strokeWidth={2.5} />
        </a>
      </div>
    );
  }

  const embedUrl = `${raw.replace(/\/$/, '')}/embed/`;

  return (
    <div className="rounded-2xl p-5 mb-6 bg-white border border-[#E7E5E4] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)]/80 text-[var(--accent)] flex items-center justify-center">
            <InstagramGlyph className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <span>Instagram Vibe</span>
        </h3>
        <a 
          href={raw} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#78716C] hover:text-[#e1306c] transition-colors"
        >
          <span>Open in App</span>
          <ArrowUpRight size={13} strokeWidth={2.5} />
        </a>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-[#E7E5E4] bg-[#FAFAF8] h-[480px]">
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
