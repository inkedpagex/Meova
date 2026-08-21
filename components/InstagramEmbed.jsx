'use client';

import React, { useState } from 'react';

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
  const isUrl = raw.startsWith('http://') || raw.startsWith('https://');
  const isPost = isUrl && (raw.includes('/p/') || raw.includes('/reel/'));

  if (!isPost) return null; // Profile feeds cannot be embedded and will show broken links. Only allow embedding posts/reels.

  const embedUrl = `${raw.replace(/\/$/, '')}/embed/`;

  return (
    <div className="rounded-3xl p-5 mb-6 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-md space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
        <span className="text-[#e1306c]">📸</span> Host Instagram Vibe
      </h3>
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] h-[480px]">
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
