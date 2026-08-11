'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Coffee, Users, Sparkles, Gamepad, Briefcase, Pencil, ChevronRight, X, ArrowLeft
} from 'lucide-react';

export default function CreateSelectorPage() {
  const router = useRouter();

  const options = [
    {
      title: 'Create Experience',
      desc: 'Host a coffee connect, study session, or casual meet-up.',
      icon: Coffee,
      color: '#7c3aed',
      badgeBg: 'bg-purple-50 border-purple-100 text-purple-600',
      gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
      href: '/create/experience'
    },
    {
      title: 'Create Community',
      desc: 'Start an exclusive interest circle for campus peers.',
      icon: Users,
      color: '#10b981',
      badgeBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      href: '/circles'
    },
    {
      title: 'Create Event',
      desc: 'Organize campus workshops, fests, or meetups.',
      icon: Sparkles,
      color: '#f97316',
      badgeBg: 'bg-orange-50 border-orange-100 text-orange-600',
      gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
      href: '/events'
    },
    {
      title: 'Create Tournament',
      desc: 'Host competitive e-sports or sports leagues.',
      icon: Gamepad,
      color: '#ec4899',
      badgeBg: 'bg-pink-50 border-pink-100 text-pink-600',
      gradient: 'from-pink-500/10 via-pink-500/5 to-transparent',
      href: '/gigs'
    },
    {
      title: 'Post a Gig',
      desc: 'Hire talent or offer paid freelance tasks for students.',
      icon: Briefcase,
      color: '#d97706',
      badgeBg: 'bg-amber-50 border-amber-100 text-amber-600',
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      href: '/gigs'
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/50 px-4 py-8 flex flex-col justify-between max-w-[560px] mx-auto anim-fade-in pb-12">
      {/* Header */}
      <div className="pt-2 px-2 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
            Campus Hub
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight mt-2">
            Create something
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Bring your campus to life with new activities.
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:border-zinc-300 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Options Stack */}
      <div className="flex-1 my-6 space-y-3.5 px-1 overflow-y-auto no-scrollbar">
        {options.map((opt) => (
          <Link
            key={opt.title}
            href={opt.href}
            className="group relative flex items-center justify-between p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-purple-300 hover:shadow-[0_8px_25px_rgba(124,58,237,0.08)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 overflow-hidden"
          >
            {/* Subtle color highlight on hover */}
            <div className={`absolute inset-0 bg-gradient-to-r ${opt.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="relative z-10 flex items-center gap-4 min-w-0">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${opt.badgeBg} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <opt.icon size={22} strokeWidth={2.2} />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-[14px] font-black text-zinc-900 tracking-tight mb-0.5 group-hover:text-purple-700 transition-colors">
                  {opt.title}
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium leading-normal truncate max-w-[300px]">
                  {opt.desc}
                </p>
              </div>
            </div>

            <div className="relative z-10 w-8 h-8 rounded-full bg-zinc-50 group-hover:bg-purple-50 flex items-center justify-center text-zinc-400 group-hover:text-purple-600 transition-all flex-shrink-0">
              <ChevronRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-zinc-400 font-semibold">
          Select an action to launch content for your university.
        </p>
      </div>
    </div>
  );
}
