'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function AvatarZoomModal({ isOpen, onClose, src, name, username }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer select-none"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-white/20 shadow-lg active:scale-90"
          title="Close"
          aria-label="Close"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Circular Avatar Zoom Container */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.75, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center cursor-default max-w-full"
        >
          {/* Zoomed Circular Avatar */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full p-1.5 bg-gradient-to-tr from-[#F05A00] via-orange-500 to-amber-400 shadow-[0_0_50px_rgba(240,90,0,0.35)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 border-4 border-white/90 shadow-2xl">
              <img
                src={src}
                alt={name || 'Profile Picture'}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          </div>

          {/* User Details Below Circle */}
          {(name || username) && (
            <div className="mt-6 text-center text-white space-y-1">
              {name && (
                <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                  {name}
                </h3>
              )}
              {username && (
                <p className="text-xs sm:text-sm font-bold text-orange-300/90 tracking-wider uppercase">
                  @{username.replace(/^@/, '')}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
