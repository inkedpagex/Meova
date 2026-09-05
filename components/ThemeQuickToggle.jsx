'use client';

import React from 'react';
import { useTheme } from './providers/ThemeProvider';
import { Palette } from '@/lib/icons';

export default function ThemeQuickToggle({ className = '', iconOnly = false }) {
  const { openThemeModal, currentAccent, mode } = useTheme();

  return (
    <button
      type="button"
      onClick={openThemeModal}
      title="Customize Theme & Colors"
      className={`flex items-center gap-2 rounded-xl transition-all cursor-pointer active:scale-95 select-none ${className}`}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-2xs"
        style={{ backgroundColor: currentAccent?.hex || 'var(--accent)' }}
      >
        <Palette size={14} />
      </div>
      {!iconOnly && (
        <div className="text-left leading-tight hidden sm:block">
          <span className="text-[12px] font-bold block text-[var(--text-primary)]">Theme</span>
          <span className="text-[9.5px] text-[var(--text-secondary)] font-medium capitalize">
            {mode} · {currentAccent?.name}
          </span>
        </div>
      )}
    </button>
  );
}
