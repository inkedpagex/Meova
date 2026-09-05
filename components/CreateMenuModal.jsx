'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Users, X, ChevronRight } from '@/lib/icons';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateMenuModal({ isOpen, onClose }) {
  const options = [
    {
      title: 'Post Photo / Moment',
      desc: 'Share campus food photos, coffee meets, or vibes.',
      icon: Camera,
      badgeBg: 'bg-[var(--accent-tint-10)] border-[var(--accent-tint-20)] text-[var(--accent)]',
      href: '/?action=create-post'
    },
    {
      title: 'Host a Circle / Channel',
      desc: 'Start an exclusive interest circle for campus peers.',
      icon: Users,
      badgeBg: 'bg-[var(--accent)] text-white border-transparent shadow-[0_2px_8px_rgba(28,25,23,0.06)]',
      href: '/circles'
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs md:hidden"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-[101] bg-white rounded-t-[32px] overflow-hidden max-w-[560px] mx-auto shadow-2xl md:hidden border-t border-[#E7E5E4]"
          >
            <div className="p-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">Create Something</h2>
                  <p className="text-[12px] text-[#78716C] font-medium mt-0.5">Bring your campus to life.</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#FAFAF8] border border-[#E7E5E4] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {options.map((opt) => (
                  <Link
                    key={opt.title}
                    href={opt.href}
                    onClick={onClose}
                    className="group flex items-center justify-between p-4 bg-white border border-[#E7E5E4] hover:border-[var(--accent)] rounded-[16px] shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-[0.98] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${opt.badgeBg}`}>
                        <opt.icon size={20} strokeWidth={2.2} />
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="text-[14px] font-bold text-[#1C1917] tracking-tight mb-0.5 group-hover:text-[var(--accent)] transition-colors">
                          {opt.title}
                        </h3>
                        <p className="text-[12px] text-[#78716C] font-medium leading-tight truncate max-w-[220px]">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-tint-10)] group-hover:bg-[var(--accent)] flex items-center justify-center text-[var(--accent)] group-hover:text-white flex-shrink-0 transition-colors">
                      <ChevronRight size={14} strokeWidth={2.5} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
