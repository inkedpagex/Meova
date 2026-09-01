'use client';

import React, { useState } from 'react';
import { Camera } from 'lucide-react';

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
      <div className="rounded-2xl p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-orange-50 border border-pink-100 flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0">
            IG
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-zinc-900 truncate">@{handle}</p>
            <p className="text-[10px] text-zinc-500 font-semibold">Instagram Profile</p>
          </div>
        </div>
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[11px] font-black hover:opacity-95 active:scale-95 transition-all shadow-2xs whitespace-nowrap flex-shrink-0"
        >
          View on Instagram ↗
        </a>
      </div>
    );
  }

  const embedUrl = `${raw.replace(/\/$/, '')}/embed/`;

  return (
    <div className="rounded-2xl p-5 mb-6 bg-white border border-zinc-100 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
          <Camera size={14} className="text-[#e1306c]" /> Instagram Vibe
        </h3>
        <a 
          href={raw} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[10px] font-black text-pink-600 hover:text-pink-700"
        >
          Open in App ↗
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
