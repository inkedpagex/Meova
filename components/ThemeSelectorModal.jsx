'use client';

import React from 'react';
import { useTheme, ACCENTS, MODES } from './providers/ThemeProvider';
import { Check, X, Sparkles, Sun, Moon, Palette } from '@/lib/icons';

export default function ThemeSelectorModal() {
  const { mode, accent, setMode, setAccent, isThemeModalOpen, closeThemeModal } = useTheme();

  if (!isThemeModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md anim-fade-in"
      onClick={closeThemeModal}
    >
      <div
        className="w-full max-w-[440px] rounded-[28px] overflow-hidden shadow-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] anim-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border-hairline)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-xs">
              <Palette size={16} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
                Theme &amp; Appearance
              </h3>
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                1-click platform customization
              </p>
            </div>
          </div>
          <button
            onClick={closeThemeModal}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Mode Selection (Light / Dark) ── */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-2.5">
              Base Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {MODES.map((m) => {
                const isSelected = mode === m.id;
                const isLight = m.id === 'light';
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`flex items-center justify-between p-3.5 rounded-[16px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-tint-10)] shadow-xs scale-[1.02]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-secondary)] hover:border-[var(--border-mid)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                          isLight
                            ? 'bg-white border-black/10 text-amber-500'
                            : 'bg-[#141414] border-white/10 text-indigo-400'
                        }`}
                      >
                        {isLight ? <Sun size={16} /> : <Moon size={16} />}
                      </div>
                      <span className="text-[13px] font-bold text-[var(--text-primary)]">
                        {m.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Accent Color (Permanent Royal Purple) ── */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-2.5">
              Permanent Signature Color
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ACCENTS.map((acc) => {
                const isSelected = accent === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccent(acc.id)}
                    className={`flex items-center justify-between p-3 rounded-[14px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-tint-10)] shadow-xs'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-secondary)] hover:border-[var(--border-mid)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-6 h-6 rounded-full shadow-inner flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: acc.hex }}
                      >
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </span>
                      <div className="text-left">
                        <span className="text-[12.5px] font-bold text-[var(--text-primary)] block leading-tight">
                          {acc.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                          {acc.badge}
                        </span>
                      </div>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: acc.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Live Interactive Preview Card ── */}
          <div className="p-4 rounded-[18px] border border-[var(--border-hairline)] bg-[var(--bg-secondary)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles size={12} className="text-[var(--accent)]" /> Live Theme Preview
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]">
                {mode === 'dark' ? 'Dark' : 'Light'} · {ACCENTS.find((a) => a.id === accent)?.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full p-[2px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                  M
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">
                  Meova Campus Experience
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium truncate">
                  Instant live meetups &amp; circles
                </p>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-full text-[12px] font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <span>Sample Action Button</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--border-hairline)] bg-[var(--bg-secondary)] flex justify-end">
          <button
            type="button"
            onClick={closeThemeModal}
            className="px-6 py-2.5 rounded-full text-xs font-bold bg-[var(--accent)] text-white hover:opacity-95 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
