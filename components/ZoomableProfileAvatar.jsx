'use client';

import React, { useState } from 'react';
import AvatarZoomModal from './AvatarZoomModal';

export default function ZoomableProfileAvatar({
  src,
  alt,
  name,
  username,
  sizeClass = 'w-20 h-20 sm:w-24 sm:h-24',
  ringColor = 'var(--accent)',
  isIdOn = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={`relative inline-flex items-center justify-center flex-shrink-0 cursor-pointer group select-none ${sizeClass} ${className}`}
        title="Click to zoom profile picture"
      >
        <div
          className="w-full h-full rounded-full p-[2px] transition-transform duration-200 group-hover:scale-105 group-active:scale-95 shadow-sm group-hover:shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: ringColor }}
        >
          <div className="w-full h-full rounded-full overflow-hidden border border-[#E7E5E4] bg-[#FAFAF8] flex items-center justify-center">
            <img
              src={src}
              alt={alt || name || 'User'}
              className="w-full h-full object-cover rounded-full transition-opacity duration-200 group-hover:opacity-90 aspect-square"
            />
          </div>
        </div>

        {/* Live Indicator */}
        {isIdOn && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)] shadow-sm" />
        )}
      </div>

      <AvatarZoomModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        src={src}
        name={name}
        username={username}
      />
    </>
  );
}
