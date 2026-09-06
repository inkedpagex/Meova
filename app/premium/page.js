'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Zap, ArrowRight, Star, Sparkles, MessageSquare, Award, Check } from '@/lib/icons';

const PREMIUM_FEATURES = [
  {
    icon: Sparkles,
    title: 'Access to Exclusive Campus Circles',
    desc: 'Join private peer circles hosted by top college clubs, hackathon teams, and student founders.',
  },
  {
    icon: Zap,
    title: 'Priority Meetup Invitations',
    desc: 'Get fast-tracked coffee & study sessions with verified seniors and campus ambassadors.',
  },
  {
    icon: Star,
    title: 'Profile Spotlight & Discover Boost',
    desc: 'Stand out on the campus Discover feed with higher visibility and verified status highlight.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Campus Chat & Collaboration',
    desc: 'Chat directly with peers across colleges without restrictions or waitlists.',
  },
  {
    icon: Award,
    title: 'Sparks Perks & Micro-Rewards',
    desc: 'Receive special platform perks and exclusive participation rewards.',
  },
];

export default function PremiumPage() {
  return (
    <div className="anim-fade-in w-full max-w-4xl mx-auto space-y-10 pb-16 px-4 pt-[68px] md:pt-6 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-[20px] bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] shadow-xs">
          <Crown size={32} />
        </div>

        <div className="space-y-2 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Meova VIP & Platform Perks
          </h1>
          <p className="text-xs text-black/70 font-semibold uppercase tracking-widest mt-1">
            Unlock exclusive college features powered by Sparks
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Features List */}
        <div className="p-7 sm:p-9 rounded-[28px] bg-white border border-black/10 shadow-xs space-y-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-black/60">
            What's included in VIP Access
          </h2>

          <div className="space-y-5">
            {PREMIUM_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] flex-shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-black tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-black/70 leading-relaxed font-medium">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white border border-black/10 rounded-[28px] p-7 sm:p-9 space-y-6 relative shadow-xs">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-black tracking-tight">
              Powered by Sparks
            </h2>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              No hidden monthly subscriptions. Unlock meetups, exclusive circles, and tip creators seamlessly with your verified Sparks wallet.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/5 border border-black/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-black">100% Student-Friendly</span>
              <span className="text-[11px] font-black text-[#7C3AED] uppercase tracking-wider">Zero Lock-In</span>
            </div>
            <ul className="space-y-2 text-xs font-medium text-black/80">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 flex-shrink-0" />
                <span>Instant 1:1 Sparks recharge via UPI</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 flex-shrink-0" />
                <span>Safe escrow protection for all bookings</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 flex-shrink-0" />
                <span>Sparks never expire on active accounts</span>
              </li>
            </ul>
          </div>

          <Link
            href="/wallet/buy"
            className="w-full py-4 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <span className="whitespace-nowrap">Recharge Sparks in Wallet</span>
            <ArrowRight size={14} className="flex-shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
