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
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden anim-scale-in border border-orange-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className="px-6 pt-6 pb-5 relative text-white"
          style={{ background: 'linear-gradient(135deg, #F05A00 0%, #D94F00 100%)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 shadow-md">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white leading-tight">Install Meova</h3>
              <p className="text-orange-100 text-xs font-medium mt-0.5">Faster access &amp; instant notifications</p>
            </div>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex gap-2">
          <button
            type="button"
            onClick={() => setDeviceTab('android')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'android'
                ? 'bg-white text-[#F05A00] shadow-xs border border-orange-200'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Smartphone size={14} />
            <span>Android</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceTab('ios')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'ios'
                ? 'bg-white text-[#F05A00] shadow-xs border border-orange-200'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Apple size={14} />
            <span>iPhone / iPad</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceTab('desktop')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'desktop'
                ? 'bg-white text-[#F05A00] shadow-xs border border-orange-200'
                : 'text-zinc-500 hover:text-zinc-800'
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
              <p className="text-xs font-bold text-zinc-700">Follow these quick steps in Chrome:</p>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <span className="w-6 h-6 rounded-full bg-[#F05A00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                    Tap the <strong>3 dots menu</strong> <MoreVertical size={14} className="inline text-[#F05A00]" />
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Located at the top right of your browser</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <span className="w-6 h-6 rounded-full bg-[#F05A00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900">
                    Tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Choose the install option in the menu list</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <span className="w-6 h-6 rounded-full bg-[#F05A00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900">
                    Tap <strong>&ldquo;Install&rdquo;</strong>
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Meova icon will appear on your home screen</p>
                </div>
              </div>
            </div>
          )}

          {deviceTab === 'ios' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-700">Follow these quick steps in Safari:</p>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <span className="w-6 h-6 rounded-full bg-[#F05A00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                    Tap the <strong>Share</strong> button <Share size={14} className="inline text-[#F05A00]" />
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Located in the bottom toolbar in Safari</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <span className="w-6 h-6 rounded-full bg-[#F05A00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900">
                    Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Look for the plus (+) square icon</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <span className="w-6 h-6 rounded-full bg-[#F05A00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900">
                    Tap <strong>&ldquo;Add&rdquo;</strong> in the top right
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Meova will launch full-screen from your Home Screen</p>
                </div>
              </div>
            </div>
          )}

          {deviceTab === 'desktop' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-700">Follow these steps in Chrome / Edge:</p>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <span className="w-6 h-6 rounded-full bg-[#F05A00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                    Click the <strong>Install icon</strong> <Download size={14} className="inline text-[#F05A00]" />
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Found at the right end of the address bar</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <span className="w-6 h-6 rounded-full bg-[#F05A00] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900">
                    Click <strong>&ldquo;Install&rdquo;</strong> in the popup
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Adds Meova to your Desktop and Taskbar</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white transition-all active:scale-95 shadow-md cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #F05A00 0%, #D94F00 100%)' }}
          >
            <Check size={14} />
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
}
