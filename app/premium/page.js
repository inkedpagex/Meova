'use client';
import React, { useState } from 'react';
import { Crown, CheckCircle2, ShieldCheck, Zap, ArrowRight, Star, Sparkles, MessageSquare, Award } from 'lucide-react';

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
    <div className="anim-fade-in w-full max-w-4xl mx-auto space-y-12 pb-16 px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
        {/* Floating gradient glow behind banner */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#6366f1]/10 blur-[80px] pointer-events-none" />

        <div className="w-16 h-16 rounded-3xl bg-[#fb923c]/10 border border-[#fb923c]/35 flex items-center justify-center text-[#fb923c] shadow-[0_8px_32px_rgba(251,146,60,0.15)] animate-pulse">
          <Crown size={32} className="fill-current" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight">
            Meetify Premium
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">
            Unlock exclusive features and supercharge your campus experience
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Features List */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
            What's included in Premium
          </h2>

          <div className="space-y-5">
            {PREMIUM_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#818cf8] flex-shrink-0">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] tracking-wide">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed font-medium">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing/Checkout Panel */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2rem] p-8 space-y-6 relative shadow-lg">
          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
            Select Your Plan
          </h2>

          <div className="space-y-3">
            {/* Monthly Plan */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className="border-2 rounded-2xl p-5 cursor-pointer flex justify-between items-center transition-all duration-200"
              style={selectedPlan === 'monthly'
                ? { borderColor: 'var(--accent)', background: 'var(--accent-glow)' }
                : { borderColor: 'var(--border-subtle)', background: 'transparent' }
              }
            >
              <div>
                <p className="text-sm font-black text-[var(--text-primary)]">Monthly Package</p>
                <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">Billed every month</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-[var(--text-primary)]">₹99</p>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">/ month</p>
              </div>
            </div>

            {/* Yearly Plan */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              className="border-2 rounded-2xl p-5 cursor-pointer flex justify-between items-center transition-all duration-200 relative overflow-hidden"
              style={selectedPlan === 'yearly'
                ? { borderColor: 'var(--accent)', background: 'var(--accent-glow)' }
                : { borderColor: 'var(--border-subtle)', background: 'transparent' }
              }
            >
              {/* Promo Badge */}
              <div className="absolute right-0 top-0 bg-[#fb923c] text-black text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                Save 40%
              </div>

              <div>
                <p className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1.5">
                  Yearly Package
                </p>
                <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">Best Value Plan</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-[#fb923c]">₹699</p>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">/ year</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSuccess(true)}
            className="btn btn-primary w-full py-4 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 group hover:-translate-y-0.5 shadow-xl transition-all"
          >
            Go Premium
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          {success && (
            <div className="anim-fade-up bg-emerald-500/10 border border-emerald-500/20 text-[#4ade80] rounded-xl p-4 flex gap-2.5 items-start">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
              <div>
                <p className="text-xs font-black text-emerald-400">Successfully Subscribed!</p>
                <p className="text-[10px] text-emerald-400/80 mt-0.5 font-bold">Welcome to the inner circle. Your Premium features are now active.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
