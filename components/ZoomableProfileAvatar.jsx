'use client';

import React, { useState } from 'react';
import AvatarZoomModal from './AvatarZoomModal';

export default function ZoomableProfileAvatar({
  src,
  alt,
  name,
  username,
  sizeClass = 'w-20 h-20 sm:w-24 sm:h-24',
  ringColor = '#6D28D9',
  isIdOn = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={`relative inline-flex items-center justify-center flex-shrink-0 cursor-pointer group select-none ${className}`}
        title="Click to zoom profile picture"
      >
        <div
          className={`${sizeClass} rounded-full p-[3px] transition-transform duration-200 group-hover:scale-105 group-active:scale-95 shadow-sm group-hover:shadow-md flex items-center justify-center flex-shrink-0`}
          style={{ background: ringColor }}
        >
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-[#FAFAF8] flex items-center justify-center">
            <img
              src={src}
              alt={alt || name || 'User'}
              className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90 max-w-full max-h-full"
            />
          </div>
        </div>

        {/* Live Indicator */}
        {isIdOn && (
          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
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
