'use client';
import React, { useState } from 'react';
import { Crown, CheckCircle2, ShieldCheck, Zap, ArrowRight, Star, Sparkles, MessageSquare, Award } from '@/lib/icons';

const PREMIUM_FEATURES = [
  {
    icon: Sparkles,
    title: 'Access to Premium Communities',
    desc: 'Join exclusive circles managed by top clubs and enterprise partners.'
  },
  {
    icon: ShieldCheck,
    title: 'Priority Event Access',
    desc: 'Get early RSVPs to high-demand campus conferences, concerts, and hackathons.'
  },
  {
    icon: Star,
    title: 'Profile Boost & Spotlight',
    desc: 'Stand out on the Discover feed with a premium tag and higher visibility.'
  },
  {
    icon: MessageSquare,
    title: 'Unlimited Chat History',
    desc: 'No limits on active chats, historical messages, or shared files/images.'
  },
  {
    icon: Award,
    title: 'Exclusive Badges & Rewards',
    desc: 'Display a premium golden crown badge on your profile and earn extra bonus Sparks.'
  }
];

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [success, setSuccess] = useState(false);

  return (
    <div className="anim-fade-in w-full max-w-4xl mx-auto space-y-12 pb-16 px-4 pt-[68px] md:pt-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[20px] border border-[#E7E5E4] bg-white p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-[16px] bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] flex items-center justify-center text-[var(--accent)] shadow-xs">
          <Crown size={32} className="fill-current" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
            Meova Premium
          </h1>
          <p className="text-xs text-[#78716C] font-bold uppercase tracking-widest mt-1">
            Unlock exclusive features and supercharge your campus life
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Features List */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
            What's included in Premium
          </h2>

          <div className="space-y-5">
            {PREMIUM_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-[12px] bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1917] tracking-wide">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed font-medium">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing/Checkout Panel */}
        <div className="bg-white border border-[#E7E5E4] rounded-[20px] p-8 space-y-6 relative shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
            Select Your Plan
          </h2>

          <div className="space-y-3">
            {/* Monthly Plan */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className="border-2 rounded-[16px] p-5 cursor-pointer flex justify-between items-center transition-all duration-200"
              style={selectedPlan === 'monthly'
                ? { borderColor: 'var(--accent)', background: 'var(--accent-tint-10)' }
                : { borderColor: '#2A2A2A', background: '#141414' }
              }
            >
              <div>
                <p className="text-sm font-bold text-[#1C1917]">Monthly Package</p>
                <p className="text-xs text-[#78716C] font-bold mt-0.5">Billed every month</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#1C1917]">₹99</p>
                <p className="text-[10px] text-[#A8A29E] font-bold uppercase tracking-wider">/ month</p>
              </div>
            </div>

            {/* Yearly Plan */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              className="border-2 rounded-[16px] p-5 cursor-pointer flex justify-between items-center transition-all duration-200 relative overflow-hidden"
              style={selectedPlan === 'yearly'
                ? { borderColor: 'var(--accent)', background: 'var(--accent-tint-10)' }
                : { borderColor: '#2A2A2A', background: '#141414' }
              }
            >
              {/* Promo Badge */}
              <div className="absolute right-0 top-0 bg-[var(--accent)] text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                Save 40%
              </div>

              <div>
                <p className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                  Yearly Package
                </p>
                <p className="text-xs text-[#78716C] font-bold mt-0.5">Best Value Plan</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--accent)]">₹699</p>
                <p className="text-[10px] text-[#A8A29E] font-bold uppercase tracking-wider">/ year</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSuccess(true)}
            className="w-full py-3.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span>Go Premium</span>
            <ArrowRight size={13} />
          </button>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-[12px] p-4 flex gap-2.5 items-start">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-800">Successfully Subscribed!</p>
                <p className="text-[10px] text-emerald-600 mt-0.5 font-bold">Welcome to the inner circle. Your Premium features are now active.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
