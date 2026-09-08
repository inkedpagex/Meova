'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import LegalFooter from '@/components/LegalFooter';
import {
  BookOpen,
  Coffee,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  X,
  Share2,
} from '@/lib/icons';

const POSTS = [
  {
    slug: 'guide-to-campus-coffee-meets',
    title: 'The Student Guide to Safe 1-on-1 Campus Coffee Meets',
    excerpt: 'How to break the ice with batchmates, verify meetups with QR check-in, and build genuine friendships on campus.',
    tag: 'Guides',
    readTime: '4 min read',
    date: 'September 2026',
    icon: Coffee,
    content: [
      'Meeting fellow students 1-on-1 is one of the best ways to network, find project teammates, and make lasting friends during your university years.',
      'Always meet in public campus spots: Meova specifically requires coffee meets and peer study sessions to occur at well-lit, populated campus venues like the central canteen, student library cafe, or faculty lawns.',
      'Using the QR Check-in: Once you and your peer arrive, open your Meova app and display your meetup QR code. The host scans the guest’s code to securely confirm arrival. This immediately releases any escrowed Sparks and records the completed meetup.',
      'Icebreaker tip: Start by discussing course projects, favorite professors, or campus clubs. Don’t feel pressured to turn it into an interview — keep it friendly, curious, and collaborative.',
    ],
  },
  {
    slug: 'growing-student-circles',
    title: 'Starting a Tech Circle on Campus: 0 to 50 Members',
    excerpt: 'Actionable tips for college club founders to organize weekly hack sessions, design critiques, and study groups.',
    tag: 'Community',
    readTime: '5 min read',
    date: 'September 2026',
    icon: Users,
    content: [
      'Campus circles are the heartbeat of extracurricular life at Indian universities. Whether it is a Next.js coding circle, AI research group, or UI/UX critique squad, here is how to grow your community.',
      '1. Pick a clear weekly rhythm: Consistency is everything. Announce a fixed 1-hour session every Wednesday evening at the campus amphitheater or Discord.',
      '2. Focus on show-and-tell: Instead of lectures, have members show what they built that week. Peer feedback creates high engagement and mutual accountability.',
      '3. Appoint co-leads: Delegate moderation and meetup logistics to active members so the circle thrives even during mid-term exams.',
    ],
  },
  {
    slug: 'campus-ambassador-playbook',
    title: 'Inside the Meova Campus Ambassador Playbook',
    excerpt: 'How leading students represent Meova on campus, unlock exclusive Sparks rewards, and build leadership credentials.',
    tag: 'Ambassadors',
    readTime: '6 min read',
    date: 'August 2026',
    icon: Award,
    content: [
      'Campus Ambassadors are the student leaders who bring Meova to their university cohorts. They act as community builders, peer mentors, and safety liaisons.',
      'Key Responsibilities: Ambassadors welcome newly admitted batchmates, help verify college ID badges, and organize campus coffee meets.',
      'Leadership Recognition: High-performing ambassadors receive an official Letter of Recommendation (LOR) from Meova leadership, custom ambassador hoodies, and private monthly strategy calls with our founding team.',
      'How to apply: Visit meova.in/ambassador. Any undergraduate or postgraduate student with high integrity and passion for community can submit an application in under 3 minutes.',
    ],
  },
  {
    slug: 'sparks-wallet-rewards',
    title: 'Everything You Need to Know About Sparks & UPI Cashouts',
    excerpt: 'A complete breakdown of Sparks earnings, referral bonuses, and instant bank transfers via UPI.',
    tag: 'Product',
    readTime: '3 min read',
    date: 'August 2026',
    icon: Sparkles,
    content: [
      'Meova’s internal economy is powered by Sparks — a transparent credit system designed to reward active campus engagement and facilitate verified bookings.',
      'Purchased vs. Earned Sparks: Recharge balances are used to book peer sessions and tip student creators. Earned Sparks come from completed meetups, approved tips, and referral rewards.',
      'Withdrawing via UPI: Once your Earned Sparks reach ₹500, enter your bank UPI ID in your Sparks Wallet. Withdrawals are processed safely through standard banking channels in India.',
    ],
  },
];

export default function BlogClient() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTag, setActiveTag] = useState('All');

  const filteredPosts = activeTag === 'All' 
    ? POSTS 
    : POSTS.filter(p => p.tag === activeTag);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#F1EEFB] selection:text-[#7657D9]">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img 
              src="/logo.png" 
              alt="Meova Logo" 
              className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-black/60 tracking-wider uppercase">Campus Blog</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-black/70 hover:text-black transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-black/70 hover:text-black whitespace-nowrap transition-colors"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="px-4 py-2 rounded-full border border-[#E7E5E4] text-[#1C1917] hover:bg-black/5 text-xs font-bold shadow-2xs whitespace-nowrap transition-transform active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-14 md:pt-16 md:pb-18 px-4 sm:px-6 border-b border-black/5">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 text-black/70 text-xs font-bold uppercase tracking-wider">
              <BookOpen size={14} />
              <span>Campus Stories &amp; Student Guides</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-[1.15]">
              Insights for Modern <br className="hidden sm:inline" />
              <span className="text-[#7657D9]">College Life.</span>
            </h1>

            <p className="text-sm sm:text-base text-black/70 font-medium max-w-lg mx-auto">
              Practical guides on peer networking, campus club leadership, safety standards, and Meova platform updates.
            </p>

            {/* Tag Filter Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-4">
              {['All', 'Guides', 'Community', 'Ambassadors', 'Product'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTag === tag
                      ? 'bg-[#7657D9] text-white shadow-xs'
                      : 'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Articles Grid ───────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post) => {
              const IconComp = post.icon;
              return (
                <div
                  key={post.slug}
                  onClick={() => setSelectedPost(post)}
                  className="p-7 sm:p-8 rounded-[28px] bg-white border border-black/10 hover:border-black/30 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-black/5 text-[#1C1917] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <IconComp size={22} />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-black/5 text-black/70 text-[11px] font-bold uppercase tracking-wider">
                        {post.tag}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-black leading-snug group-hover:text-black transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-black/70 leading-relaxed font-medium">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-black/5 flex items-center justify-between text-xs font-bold text-black/50">
                    <div className="flex items-center gap-3">
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <span className="text-black font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Read Guide <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Bottom CTA ──────────────────────────────────────────────── */}
        <section className="bg-black text-white py-16 px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to experience campus life?
            </h2>
            <p className="text-xs sm:text-sm text-white/70 font-medium">
              Join thousands of students connecting, meeting up, and joining circles on Meova.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white font-bold text-xs sm:text-sm shadow-sm shadow-[#7657D9]/12 whitespace-nowrap flex-shrink-0 transition-transform active:scale-95 cursor-pointer"
              >
                <span>Create Free Student Account</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/ambassador"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-transform active:scale-95"
              >
                <span>Apply as Ambassador</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Full Article Reader Modal ───────────────────────────────── */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-9 shadow-2xl border border-black/10 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/5 text-black/80 text-[11px] font-bold uppercase tracking-wider">
                  {selectedPost.tag}
                </span>
                <span className="text-xs text-black/50 font-semibold">{selectedPost.date}</span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/70 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-snug">
                {selectedPost.title}
              </h2>
              <p className="text-xs text-black/60 font-semibold flex items-center gap-1.5">
                <Clock size={13} /> {selectedPost.readTime}
              </p>
            </div>

            <div className="space-y-4 text-sm text-black/80 font-medium leading-relaxed">
              {selectedPost.content.map((p, idx) => (
                <p key={idx} className="bg-[#FAFAF8] p-4 rounded-2xl border border-black/5">
                  {p}
                </p>
              ))}
            </div>

            <div className="pt-4 border-t border-black/10 flex items-center justify-between flex-wrap gap-3">
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-full border border-[#E7E5E4] text-[#1C1917] hover:bg-black/5 text-xs font-bold shadow-2xs transition-all active:scale-95"
              >
                Join Meova
              </Link>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-black/90 cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Standard Legal & Compliance Footer ──────────────────────── */}
      <LegalFooter />
    </div>
  );
}
