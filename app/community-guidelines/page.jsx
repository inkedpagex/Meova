import Link from 'next/link';
import LegalFooter from '@/components/LegalFooter';
import { Users, ShieldCheck, Coffee, AlertTriangle, ArrowLeft, Flag } from '@/lib/icons';

export const metadata = {
  title: 'Community Guidelines — Meova',
  description: 'Our campus code of conduct for in-person student meetups, messaging etiquette, and safety standards on Meova.',
  alternates: { canonical: 'https://meova.in/community-guidelines' },
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#F1EEFB] selection:text-[#7657D9]">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-[#7657D9] tracking-wider uppercase">Guidelines</span>
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
            <span>Campus Code of Conduct</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Community Guidelines
          </h1>
          <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
            Building a Respectful, High-Trust Campus Network
          </p>
        </div>

        <div className="space-y-10 text-sm text-black/80 leading-relaxed font-medium">
          {/* Principle */}
          <section className="p-6 sm:p-7 rounded-[26px] bg-[#F1EEFB] border border-[#D9D1F2] space-y-2">
            <h2 className="text-base font-black text-[#7657D9]">Our Core Philosophy</h2>
            <p className="text-xs sm:text-sm text-black/80 leading-relaxed">
              Meova is built exclusively for verified university students to socialize, study together, and collaborate. We treat each other with mutual respect, academic integrity, and consideration. These guidelines ensure our campuses remain welcoming and secure for everyone.
            </p>
          </section>

          {/* Section 1: In-Person Meetups */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
              <Coffee size={18} className="text-[#7657D9]" />
              1. In-Person Meetup Standards
            </h2>
            <p>
              1-on-1 coffee meets and study sessions represent the core of Meova. To ensure safe, comfortable interactions:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>Mandatory Public Campus Locations:</strong> Meetups must always take place in visible, public university spaces — campus food courts, library study halls, official university cafes, or central campus lawns.
              </li>
              <li>
                <strong>No Private or Off-Campus Pressure:</strong> Never pressure a peer to meet in secluded, unapproved off-campus venues, hostels, or residences.
              </li>
              <li>
                <strong>Punctuality &amp; Courtesy:</strong> Respect your batchmate's schedule. If running late or unable to attend, communicate in chat beforehand or cancel respectfully.
              </li>
              <li>
                <strong>QR Code Check-In:</strong> Always verify attendance using the in-app QR check-in protocol to confirm the meetup securely and release escrow.
              </li>
            </ul>
          </section>

          {/* Section 2: Messaging & Etiquette */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">2. Messaging &amp; Communication Etiquette</h2>
            <p>Direct chats on Meova are designed for friendly, collegiate connection:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-xs">
              <li>
                <strong>Zero Tolerance for Harassment:</strong> Bullying, stalking, sexual advances, or unsolicited explicit images will result in immediate permanent expulsion.
              </li>
              <li>
                <strong>Respect Boundaries:</strong> If another student declines a meetup or stops replying, respect their choice. Repeated unwanted contact is strictly prohibited.
              </li>
              <li>
                <strong>No Commercial Spam or Promotions:</strong> Do not use campus chats to broadcast promotional flyers, external links, or commercial products.
              </li>
            </ul>
          </section>

          {/* Section 3: Circles & Clubs */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">3. Student Circles &amp; Campus Posts</h2>
            <p>Circles allow students to organize hackathons, design sessions, and sports clubs:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-xs">
              <li>Circle leaders must foster inclusive, constructive environments for batchmates.</li>
              <li>Posts in the campus moments feed must be authentic and campus-relevant.</li>
              <li>Content promoting ragging, casteism, religious intolerance, or political hostility is strictly banned.</li>
            </ul>
          </section>

          {/* Section 4: Reporting & Enforcement */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
              <Flag size={18} className="text-red-600" />
              4. How to Report Violations &amp; Enforcement Actions
            </h2>
            <p>
              If someone makes you feel uncomfortable or violates these guidelines, you have multiple direct enforcement tools:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>In-App Block:</strong> Immediately block the user to prevent them from messaging you or seeing your radar status.
              </li>
              <li>
                <strong>Report to Campus Ambassador:</strong> Use the &quot;Report User&quot; button on their profile. The report is routed to your campus ambassador and university moderators.
              </li>
              <li>
                <strong>Enforcement Ladder:</strong> Depending on severity, violations result in formal warnings, 7-day feature suspensions, or permanent blacklist from the Meova platform.
              </li>
            </ul>
          </section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
