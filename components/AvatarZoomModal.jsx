'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';

export default function AvatarZoomModal({ isOpen, onClose, src, name, username }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[999999] flex flex-col justify-between items-center p-6 bg-black select-none"
      >
        {/* Top Bar Header */}
        <div className="w-full max-w-md flex items-center justify-between z-10 pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer border border-white/10 active:scale-95"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 active:scale-95"
            title="Close"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Center Circular Zoomed Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
          className="my-auto flex flex-col items-center cursor-default"
        >
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full p-1.5 bg-gradient-to-tr from-[#F05A00] via-orange-500 to-amber-400 shadow-[0_0_60px_rgba(240,90,0,0.35)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 border-4 border-white shadow-2xl">
              <img
                src={src}
                alt={name || 'Profile Picture'}
                className="w-full h-full object-cover select-none pointer-events-none"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=F05A00&color=ffffff&size=512&bold=true`;
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Bottom User Info */}
        <div className="w-full max-w-md text-center z-10 pb-4" onClick={(e) => e.stopPropagation()}>
          {name && (
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {name}
            </h3>
          )}
          {username && (
            <p className="text-xs sm:text-sm font-bold text-orange-400 tracking-widest uppercase mt-1">
              @{username.replace(/^@/, '')}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
