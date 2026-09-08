'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LegalFooter from '@/components/LegalFooter';
import {
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  Mail,
  ArrowLeft,
} from '@/lib/icons';


const FAQS = [
  // ── 1. Student Verification (5 FAQs) ──────────────────────────────────
  {
    category: 'verification',
    q: 'How do I verify my college student status?',
    a: 'You can verify your profile by entering your official university email address (e.g. your_name@university.edu or @college.ac.in) during onboarding or in Settings, or by uploading a clear photo of your valid student ID card for quick verification by our campus team.',
  },
  {
    category: 'verification',
    q: 'What if my college is not listed on Meova yet?',
    a: 'We are expanding across universities rapidly! You can select "Other" during registration or apply as a founding Campus Ambassador to bring Meova officially to your university campus.',
  },
  {
    category: 'verification',
    q: 'Is my student ID stored securely and privately?',
    a: 'Yes, strictly. Student ID images are stored in a private, encrypted storage bucket accessible only to vetted campus verifiers. Once your identity is verified, your physical ID card is never displayed publicly or shared with third parties.',
  },
  {
    category: 'verification',
    q: 'How long does manual student ID verification take?',
    a: 'Student ID card reviews are processed by campus verifiers typically within 2 to 6 hours during university working hours. Once approved, a verified checkmark badge appears instantly on your profile.',
  },
  {
    category: 'verification',
    q: 'Can I change my registered college after onboarding?',
    a: 'To maintain campus safety and prevent impersonation, college affiliations can only be changed by contacting the verification support desk with proof of college transfer or updated ID credentials.',
  },

  // ── 2. 1-on-1 Campus Meets (5 FAQs) ───────────────────────────────────
  {
    category: 'meetups',
    q: 'How does QR verification work during campus meetups?',
    a: 'When you book a 1-on-1 meet and the other student accepts, both of you receive a unique QR code. When meeting at the designated campus cafe, canteen, or library, scan each other\'s QR code to confirm arrival and record the meetup securely.',
  },
  {
    category: 'meetups',
    q: 'Are campus meetups safe?',
    a: 'Yes. Every member on Meova is student-verified. Meetups are strictly intended for public campus locations like university cafes, canteens, and central libraries. Never meet off-campus with people you have not vetted, and never share financial credentials.',
  },
  {
    category: 'meetups',
    q: 'Can I cancel or reschedule a scheduled peer meetup?',
    a: 'Yes. You can cancel a scheduled meetup from your Bookings tab at any time prior to the meeting time. If any reservation Sparks were held in escrow, they are automatically returned to your wallet.',
  },
  {
    category: 'meetups',
    q: 'What should I do if a student does not show up for a meet?',
    a: 'If the other student fails to arrive within 15 minutes of the scheduled time, you can mark "Student Did Not Arrive" in the meet screen. The session will automatically close without affecting your campus trust rating.',
  },
  {
    category: 'meetups',
    q: 'Can outside non-students join or book campus meetups?',
    a: 'No. Meova enforces a 100% verified student perimeter. Unverified users or outside strangers cannot view campus presence or book peer meetups.',
  },

  // ── 3. Sparks Wallet & UPI (5 FAQs) ───────────────────────────────────
  {
    category: 'sparks',
    q: 'What are Sparks and how do they work?',
    a: 'Sparks are Meova\'s in-app campus appreciation currency. 1 Spark = ₹1 INR. You can earn Sparks by hosting helpful study sessions, receiving tips from peers for campus advice, and referring fellow students.',
  },
  {
    category: 'sparks',
    q: 'How do I withdraw my Sparks to my bank account?',
    a: 'Navigate to Wallet in the app, tap "Withdraw", enter your UPI ID (e.g., yourname@oksbi), and confirm. Withdrawals are processed directly to your verified UPI handle with zero transaction fee deductions.',
  },
  {
    category: 'sparks',
    q: 'What is the difference between Purchased Sparks and Earned Sparks?',
    a: 'Purchased Sparks are recharge credits used to facilitate peer interactions and book sessions (non-withdrawable). Earned Sparks are earned through peer meetups, creator tipping, and referral bonuses (eligible for instant UPI withdrawal).',
  },
  {
    category: 'sparks',
    q: 'What is the minimum Sparks withdrawal threshold?',
    a: 'The minimum withdrawal limit is 50 Earned Sparks (₹50 INR). Once your earned balance reaches 50 Sparks, you can request an instant payout to your registered UPI ID.',
  },
  {
    category: 'sparks',
    q: 'Are payments and wallet transactions secure on Meova?',
    a: 'Yes. All payments and recharge transactions are handled through RBI-regulated payment gateways. Meova never stores your debit/credit card numbers or UPI PIN.',
  },

  // ── 4. Student Circles & Clubs (5 FAQs) ───────────────────────────────
  {
    category: 'circles',
    q: 'How do I create or join a campus circle?',
    a: 'Navigate to Circles in the app to discover verified student circles for your university (coding, design, sports, music). You can join public circles instantly or submit a request for private moderation circles.',
  },
  {
    category: 'circles',
    q: 'Who can create a new campus circle or club?',
    a: 'Any verified student with a good standing score can apply to create a new circle for their college. Campus moderators review and approve circle creation within 24 hours.',
  },
  {
    category: 'circles',
    q: 'Can students from other universities join my college circle?',
    a: 'Campus circles can be configured as either "Campus Exclusive" (restricted strictly to students of your university) or "Cross-Campus" (open to verified students across Indian colleges).',
  },
  {
    category: 'circles',
    q: 'How are discussions inside circles moderated?',
    a: 'Circle creators and student moderators have full administrative tools to remove spam, mute disruptive accounts, and pin important announcements. Community guidelines are strictly enforced.',
  },
  {
    category: 'circles',
    q: 'Can we host events or competitions through our circle?',
    a: 'Yes. Circle leads can broadcast campus events, hackathons, sports matches, and study drives directly to all members of their circle with real-time push notifications.',
  },

  // ── 5. Campus Ambassador Program (5 FAQs) ─────────────────────────────
  {
    category: 'ambassador',
    q: 'How do I become a Campus Ambassador for my university?',
    a: 'Visit meova.in/ambassador, fill out the short application form, and our campus expansion desk will review your application within 24–48 hours. No prior login is required to apply.',
  },
  {
    category: 'ambassador',
    q: 'What are the perks of being a Meova Ambassador?',
    a: 'Ambassadors receive an official Certificate & Letter of Recommendation (LOR), exclusive Meova hoodies and swag, dedicated campus moderation tools, and direct access to the founding team.',
  },
  {
    category: 'ambassador',
    q: 'What are the key responsibilities of a Campus Ambassador?',
    a: 'Ambassadors lead campus expansion: helping onboard fellow classmates, verifying local campus meeting hotspots (canteens, cafes), and moderating university circles.',
  },
  {
    category: 'ambassador',
    q: 'Is the Campus Ambassador program paid?',
    a: 'Yes. Ambassadors earn high-yield Spark rewards and cash incentives for active campus onboardings, event organizations, and verified peer activities on campus.',
  },
  {
    category: 'ambassador',
    q: 'How long does the Ambassador tenure last?',
    a: 'A typical ambassador term lasts for 1 academic semester (4–6 months). Outstanding ambassadors are promoted to Lead Campus Director roles with additional leadership stipends.',
  },
];

export default function HelpCenterClient() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#F1EEFB] selection:text-[#7657D9]">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-black/60 tracking-wider uppercase">Help Center</span>
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
              className="px-5 py-2.5 rounded-full bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white text-xs font-bold shadow-sm shadow-[#7657D9]/12 whitespace-nowrap transition-transform active:scale-95 cursor-pointer"
            >
              Join Campus
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Section (Focused & Clean) ────────────────── */}
        <section className="relative overflow-hidden pt-10 pb-8 sm:pt-14 sm:pb-10 px-4 sm:px-6 bg-white border-b border-black/5">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 text-[#1C1917] border border-black/10 text-xs font-bold uppercase tracking-wider">
              <HelpCircle size={14} />
              <span>Meova Knowledge Base &amp; Student Support</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight">
              Frequently Asked Questions
            </h1>

            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-lg mx-auto leading-relaxed">
              Clear answers, guides, and security policies for students across Indian universities.
            </p>
          </div>
        </section>

        {/* ── All Frequently Asked Questions ────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20">
          <div className="space-y-3.5">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className={`bg-white border rounded-[22px] overflow-hidden transition-all ${
                    isOpen ? 'border-black/30 shadow-xs ring-1 ring-black/5' : 'border-black/10 hover:border-black/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full p-4 sm:p-5 font-bold text-sm text-left text-black flex justify-between items-center select-none cursor-pointer"
                  >
                    <span className="text-black">{faq.q}</span>
                    <ChevronDown
                      size={17}
                      className={`text-black/40 transition-transform duration-250 shrink-0 ml-3 ${
                        isOpen ? 'rotate-180 text-black' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden border-t border-black/5 bg-[#FAFAF8]/50"
                      >
                        <div className="px-4 sm:px-5 pb-5 pt-3 text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Direct Support Banner ───────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <div className="p-8 sm:p-10 rounded-[30px] bg-black text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">Still have questions?</h3>
              <p className="text-xs sm:text-sm text-white/70 max-w-md">
                Our campus community team is available 7 days a week to help with verifications, reports, or questions.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link
                href="/contact"
                className="px-6 py-3 rounded-full bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-[#7657D9]/12 cursor-pointer"
              >
                <Mail size={15} />
                <span>Contact Desk</span>
              </Link>
              <Link
                href="/ambassador"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold whitespace-nowrap transition-all active:scale-95"
              >
                <span>Ambassador FAQ</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Standard Legal & Compliance Footer ──────────────────────── */}
      <LegalFooter />
    </div>
  );
}
