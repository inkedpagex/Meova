import Link from 'next/link';
import LegalFooter from '@/components/LegalFooter';
import { ShieldCheck, Lock, Eye, Trash2, ArrowLeft } from '@/lib/icons';

export const metadata = {
  title: 'Privacy Policy — Meova',
  description: 'How Meova collects, stores, protects, and retains your data. Learn about our strict student ID privacy and 7-day message deletion policy.',
  alternates: { canonical: 'https://meova.in/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#F1EEFB] selection:text-[#7657D9]">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-[#7657D9] tracking-wider uppercase">Privacy</span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black/70 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F1EEFB] text-[#7657D9] border border-[#D9D1F2] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={13} />
            <span>Privacy &amp; Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Privacy Policy
          </h1>
          <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
            Effective Date: September 2026 · Version 2026.1
          </p>
        </div>

        <div className="space-y-10 text-sm text-black/80 leading-relaxed font-medium">
          {/* Section 1 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">1. Information We Collect</h2>
            <p>
              To provide a safe, student-verified campus network, Meova collects the following categories of information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>Profile &amp; Academic Data:</strong> Full name, university email address, college, branch, year of study, profile photo, bio, and student interests.
              </li>
              <li>
                <strong>Student Verification Credentials:</strong> Institutional email verification tokens, student identity card photos, and verification selfies submitted during the verification badge application process.
              </li>
              <li>
                <strong>Campus Presence &amp; Meetups:</strong> Live campus radar status (e.g. &quot;Free Now at GD Subway&quot;), meetup bookings, QR verification timestamps, and meeting check-in codes.
              </li>
              <li>
                <strong>Communications:</strong> Direct peer-to-peer chats and messages.
              </li>
              <li>
                <strong>Wallet &amp; Payment Data:</strong> Sparks ledger balance, recharge transaction references (UTR/UPI IDs), and withdrawal bank/UPI details.
              </li>
              <li>
                <strong>Device &amp; Security Telemetry:</strong> IP address, device model, operating system, and push notification tokens (FCM) used strictly for account security and anti-fraud enforcement.
              </li>
            </ul>
          </section>

          {/* Section 2: Storage of Verification Docs */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">2. Private Storage of Student ID Documents</h2>
            <div className="p-4 rounded-2xl bg-[#F1EEFB] border border-[#D9D1F2] text-[#111827] text-xs font-medium space-y-1.5">
              <p className="font-bold text-[#7657D9] flex items-center gap-1.5">
                <Lock size={14} /> Bank-Grade Restricted Storage
              </p>
              <p>
                Student ID card images and verification selfies are stored in private, isolated cloud storage buckets with zero public URL access. These documents are accessible exclusively by verified super-administrators during the verification review and are never made visible to peers, campus ambassadors, or third parties.
              </p>
            </div>
          </section>

          {/* Section 3: Data Retention & 7-Day Auto Deletion */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">3. Data Retention &amp; 7-Day Message Auto-Deletion</h2>
            <p>
              We believe students shouldn't carry permanent digital baggage from casual campus conversations. Meova operates an automated data expiration protocol:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>Direct Chat Messages:</strong> All peer-to-peer chat messages and attachments are automatically and permanently deleted from our servers after <strong>7 days</strong>.
              </li>
              <li>
                <strong>Campus Radar Presence:</strong> Live location status broadcasts automatically expire within <strong>2 hours</strong> unless manually refreshed.
              </li>
              <li>
                <strong>Financial Ledger Logs:</strong> Sparks transaction records are retained for a minimum of 5 years to comply with statutory financial record-keeping standards in India.
              </li>
            </ul>
          </section>

          {/* Section 4: Third-Party Sub-processors */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">4. Third-Party Sub-processors &amp; Partners</h2>
            <p>
              We do not sell your personal information. We partner with specialized infrastructure providers under strict confidentiality agreements:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                <p className="font-bold text-black">Firebase (Google)</p>
                <p className="text-black/70">Secure push notification delivery &amp; real-time messaging.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                <p className="font-bold text-black">Cloudinary</p>
                <p className="text-black/70">Encrypted image hosting &amp; media content delivery.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                <p className="font-bold text-black">Metered / WebRTC</p>
                <p className="text-black/70">Encrypted peer-to-peer voice and audio call routing.</p>
              </div>
            </div>
          </section>

          {/* Section 5: User Rights */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">5. Your Data Rights &amp; Account Deletion</h2>
            <p>
              Under Indian information technology standards and the Digital Personal Data Protection (DPDP) Act, you possess the right to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-xs">
              <li>Request a copy of your personal data stored on Meova.</li>
              <li>Update or correct inaccurate profile or academic information.</li>
              <li>Request permanent account deletion and erasure of all associated personal data by emailing support@meova.in.</li>
            </ul>
          </section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
