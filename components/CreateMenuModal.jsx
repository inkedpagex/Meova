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
      badgeBg: 'bg-orange-50 border-orange-200 text-[#F05A00]',
      href: '/?action=create-post'
    },
    {
      title: 'Host a Circle / Channel',
      desc: 'Start an exclusive interest circle for campus peers.',
      icon: Users,
      badgeBg: 'bg-orange-500 text-white border-transparent shadow-xs',
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
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-[101] bg-white rounded-t-[32px] overflow-hidden max-w-[560px] mx-auto shadow-2xl md:hidden"
          >
            <div className="p-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-black tracking-tight">Create Something</h2>
                  <p className="text-[11.5px] text-black/65 font-bold mt-0.5">Bring your campus to life.</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-orange-50/60 border border-orange-100 flex items-center justify-center text-black hover:bg-orange-100 transition-colors cursor-pointer"
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
                    className="group flex items-center justify-between p-4 bg-white border border-black/10 hover:border-[#F05A00] rounded-2xl shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${opt.badgeBg}`}>
                        <opt.icon size={20} strokeWidth={2.2} />
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="text-[13.5px] font-black text-black tracking-tight mb-0.5 group-hover:text-[#F05A00] transition-colors">
                          {opt.title}
                        </h3>
                        <p className="text-[11px] text-black/65 font-medium leading-tight truncate max-w-[220px]">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-50 group-hover:bg-[#F05A00] flex items-center justify-center text-[#F05A00] group-hover:text-white flex-shrink-0 transition-colors">
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
