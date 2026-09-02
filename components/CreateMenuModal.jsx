'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Users, Briefcase, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

export default function CreateMenuModal({ isOpen, onClose }) {
  const { data: flagsData } = useSWR('/api/feature-flags', fetcher, {
    dedupingInterval: 15000,
  });
  const isGigsEnabled = flagsData?.flags?.gigs === true;

  const rawOptions = [
    {
      title: 'Post Photo / Moment',
      desc: 'Share campus food photos, coffee meets, or vibes.',
      icon: Camera,
      badgeBg: 'bg-orange-50 border-orange-200 text-orange-600',
      href: '/?action=create-post'
    },
    {
      title: 'Host a Channel',
      desc: 'Start an exclusive interest circle for campus peers.',
      icon: Users,
      badgeBg: 'bg-red-50 border-red-200 text-red-500',
      href: '/circles'
    },
    {
      id: 'gigs',
      title: 'Post a Gig',
      desc: 'Hire talent or offer paid freelance tasks for students.',
      icon: Briefcase,
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-600',
      href: '/gigs?action=post-gig'
    },
  ];

  const options = rawOptions.filter(opt => opt.id !== 'gigs' || isGigsEnabled);

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
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight">Create something</h2>
                  <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">Bring your campus to life.</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
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
                    className="group flex items-center justify-between p-3.5 bg-white border border-zinc-200/70 rounded-2xl shadow-sm hover:border-orange-200 hover:shadow-md active:scale-[0.98] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${opt.badgeBg}`}>
                        <opt.icon size={20} strokeWidth={2.2} />
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="text-[13px] font-black text-zinc-900 tracking-tight mb-0.5">
                          {opt.title}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-medium leading-tight truncate max-w-[200px]">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#f4f3ee] flex items-center justify-center text-zinc-400 group-hover:bg-orange-50 group-hover:text-[#F05A00] flex-shrink-0 transition-colors">
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
