import Link from 'next/link';
import LegalFooter from '@/components/LegalFooter';
import { ShieldCheck, Scale, AlertTriangle, ArrowLeft } from '@/lib/icons';

export const metadata = {
  title: 'Terms of Service — Meova',
  description: 'Terms and conditions for using the Meova campus platform, wallet rules, meetup facilitation, and safety policies.',
  alternates: { canonical: 'https://meova.in/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#7C3AED]/20 selection:text-[#7C3AED]">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-[#7C3AED] tracking-wider uppercase">Legal</span>
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
            <Scale size={13} />
            <span>Official Platform Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Terms of Service
          </h1>
          <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
            Effective Date: September 2026 · Version 2026.1
          </p>
        </div>

        <div className="space-y-10 text-sm text-black/80 leading-relaxed font-medium">
          {/* Section 1 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">1. Acceptance of Terms &amp; Scope</h2>
            <p>
              By accessing, browsing, registering for, or using Meova (the &quot;Platform&quot;, available at meova.in and app.meova.in), you enter into a legally binding agreement with Meova Inc. (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). If you do not agree to these Terms, you must discontinue using the Platform immediately.
            </p>
            <p>
              These Terms apply to all registered members, campus ambassadors, moderators, and visitors across all college communities.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">2. User Eligibility (18+ Mandatory)</h2>
            <p>
              Due to physical in-person meetup facilitation, voice calling capabilities, and financial wallet transactions, you must be <strong>at least 18 years of age</strong> and an enrolled university student or recognized campus affiliate to register an account.
            </p>
            <p>
              By registering on Meova, you represent and warrant that all identification, institutional email addresses, and verification credentials you submit are accurate, authentic, and belong to you.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">3. Student Verification &amp; Truth in Identity</h2>
            <p>
              Meova enforces strict student verification via official institutional emails (@college.edu / @college.ac.in) and student ID card validation.
            </p>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-red-700">
                <AlertTriangle size={14} /> Strict Penalty for False ID
              </p>
              <p>
                Uploading forged, altered, or third-party student identity documents is a criminal offense under the Information Technology Act, 2000. Providing deceptive credentials will result in immediate permanent account termination, blacklisting of device identifiers, and forfeiture of any wallet balance.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">4. Wallet Economy: Purchased vs. Earned Sparks</h2>
            <p>
              Meova operates an internal digital credits system called <strong>Sparks</strong>. The wallet enforces a structural distinction:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>Purchased Balance:</strong> Sparks acquired through UPI recharges are strictly non-refundable and <strong>non-withdrawable</strong>. Purchased Sparks can only be used on the platform for booking coffee meets, joining premium circles, and tipping creators.
              </li>
              <li>
                <strong>Earned Balance:</strong> Sparks earned through completing verified meetups, campus ambassador rewards, or tips from peers are <strong>withdrawable</strong> directly to your Indian bank account via UPI, subject to our ₹500 minimum withdrawal threshold.
              </li>
              <li>
                <strong>Escrow Mechanism:</strong> When you book a meetup, the required Sparks are locked in platform escrow. They are credited to the host only after both parties scan and confirm attendance via QR code and PIN verification.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">5. In-Person Campus Meets &amp; Facilitation Disclaimer</h2>
            <p>
              Meova is a technological platform that facilitates peer connections. <strong>Meova does not employ, supervise, or control users during physical meetups.</strong>
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium space-y-1.5">
              <p className="font-bold text-amber-900">Safety &amp; Public Venue Requirement:</p>
              <p>
                All meetups must take place in designated, well-lit, public campus locations (e.g., campus cafes, libraries, canteens, central courtyards). Users are solely responsible for their personal safety and belongings. Meova explicitly disclaims all liability for any damages, injuries, losses, or disputes arising from in-person meetings.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">6. Prohibited Conduct</h2>
            <p>Users agree not to engage in any of the following activities:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-xs">
              <li>Stalking, harassment, abusive messages, or unwanted physical contact.</li>
              <li>Creating duplicate, impersonated, or automated accounts.</li>
              <li>Circumventing platform payment mechanisms or conducting unauthorized off-platform transactions.</li>
              <li>Posting hate speech, explicit content, defamatory statements, or intellectual property infringements.</li>
              <li>Misusing the Campus Ambassador or Moderation tools for personal bias or harassment.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">7. Moderation, Suspensions &amp; Termination</h2>
            <p>
              Meova Campus Ambassadors and Platform Staff reserve the right to review user reports, flag suspicious activity, and suspend or terminate accounts without prior notice if these Terms or Community Guidelines are violated.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">8. Governing Law &amp; Dispute Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India, without regard to conflict of law principles. Any legal suit, action, or proceeding arising out of or related to the Platform shall be instituted exclusively in the competent courts located in Mathura, Uttar Pradesh, India.
            </p>
          </section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
