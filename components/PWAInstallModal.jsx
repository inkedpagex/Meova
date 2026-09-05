'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Share, MoreVertical, Smartphone, Laptop, Check, Apple } from '@/lib/icons';

export default function PWAInstallModal({ isOpen, onClose }) {
  const [deviceTab, setDeviceTab] = useState('android'); // 'android' | 'ios' | 'desktop'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    if (/iphone|ipad|ipod/i.test(ua)) {
      setDeviceTab('ios');
    } else if (/android/i.test(ua)) {
      setDeviceTab('android');
    } else {
      setDeviceTab('desktop');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 anim-fade-in"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden anim-scale-in border border-[var(--accent-tint-20)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className="px-6 pt-6 pb-5 relative text-white"
          style={{ background: 'var(--accent)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[16px] bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 shadow-md">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">Install Meova</h3>
              <p className="text-[var(--accent-tint-10)] text-xs font-medium mt-0.5">Faster access &amp; instant notifications</p>
            </div>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="p-4 bg-[#FAFAF8] border-b border-[#E7E5E4] flex gap-2">
          <button
            type="button"
            onClick={() => setDeviceTab('android')}
            className={`flex-1 py-2 px-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'android'
                ? 'bg-white text-[var(--accent)] shadow-xs border border-[var(--accent-tint-20)]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Smartphone size={14} />
            <span>Android</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceTab('ios')}
            className={`flex-1 py-2 px-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'ios'
                ? 'bg-white text-[var(--accent)] shadow-xs border border-[var(--accent-tint-20)]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Apple size={14} />
            <span>iPhone / iPad</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceTab('desktop')}
            className={`flex-1 py-2 px-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'desktop'
                ? 'bg-white text-[var(--accent)] shadow-xs border border-[var(--accent-tint-20)]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Laptop size={14} />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {deviceTab === 'android' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#78716C]">Follow these quick steps in Chrome:</p>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-[var(--accent-tint-10)]/60 border border-[var(--accent-tint-20)]">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C1917] flex items-center gap-1">
                    Tap the <strong>3 dots menu</strong> <MoreVertical size={14} className="inline text-[var(--accent)]" />
                  </p>
                  <p className="text-[11px] text-[#78716C] font-medium mt-0.5">Located at the top right of your browser</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-[var(--accent-tint-10)]/60 border border-[var(--accent-tint-20)]">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C1917]">
                    Tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>
                  </p>
                  <p className="text-[11px] text-[#78716C] font-medium mt-0.5">Choose the install option in the menu list</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-[var(--accent-tint-10)]/60 border border-[var(--accent-tint-20)]">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C1917]">
                    Tap <strong>&ldquo;Install&rdquo;</strong>
                  </p>
                  <p className="text-[11px] text-[#78716C] font-medium mt-0.5">Meova icon will appear on your home screen</p>
                </div>
              </div>
            </div>
          )}

          {deviceTab === 'ios' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#78716C]">Follow these quick steps in Safari:</p>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-[var(--accent-tint-10)]/60 border border-[var(--accent-tint-20)]">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C1917] flex items-center gap-1">
                    Tap the <strong>Share</strong> button <Share size={14} className="inline text-[var(--accent)]" />
                  </p>
                  <p className="text-[11px] text-[#78716C] font-medium mt-0.5">Located in the bottom toolbar in Safari</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-[var(--accent-tint-10)]/60 border border-[var(--accent-tint-20)]">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C1917]">
                    Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                  </p>
                  <p className="text-[11px] text-[#78716C] font-medium mt-0.5">Look for the plus (+) square icon</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-[var(--accent-tint-10)]/60 border border-[var(--accent-tint-20)]">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C1917]">
                    Tap <strong>&ldquo;Add&rdquo;</strong> in the top right
                  </p>
                  <p className="text-[11px] text-[#78716C] font-medium mt-0.5">Meova will launch full-screen from your Home Screen</p>
                </div>
              </div>
            </div>
          )}

          {deviceTab === 'desktop' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#78716C]">Follow these steps in Chrome / Edge:</p>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-[var(--accent-tint-10)]/60 border border-[var(--accent-tint-20)]">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C1917] flex items-center gap-1">
                    Click the <strong>Install icon</strong> <Download size={14} className="inline text-[var(--accent)]" />
                  </p>
                  <p className="text-[11px] text-[#78716C] font-medium mt-0.5">Found at the right end of the address bar</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-[var(--accent-tint-10)]/60 border border-[var(--accent-tint-20)]">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C1917]">
                    Click <strong>&ldquo;Install&rdquo;</strong> in the popup
                  </p>
                  <p className="text-[11px] text-[#78716C] font-medium mt-0.5">Adds Meova to your Desktop and Taskbar</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAFAF8] border-t border-[#E7E5E4]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-[16px] font-bold text-xs uppercase tracking-wider text-white transition-all active:scale-95 shadow-md cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)' }}
          >
            <Check size={14} />
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
}
