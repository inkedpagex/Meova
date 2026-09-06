import Link from 'next/link';
import LegalFooter from '@/components/LegalFooter';
import { Scale, Mail, Clock, MapPin, ArrowLeft, ShieldCheck } from '@/lib/icons';

export const metadata = {
  title: 'Grievance Officer & Redressal Mechanism — Meova',
  description: 'Official Grievance Officer contact details and redressal process pursuant to Rule 3(11) of the Information Technology Rules, 2021.',
  alternates: { canonical: 'https://meova.in/grievance' },
};

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#7C3AED]/20 selection:text-[#7C3AED]">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-[#7C3AED] tracking-wider uppercase">Compliance</span>
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
            <span>Statutory Compliance Notice</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Grievance Redressal Mechanism
          </h1>
          <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
            In compliance with Rule 3(11) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021
          </p>
        </div>

        <div className="space-y-10 text-sm text-black/80 leading-relaxed font-medium">
          {/* Statutory Card */}
          <section className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#7C3AED]/30 shadow-lg shadow-[#7C3AED]/5 space-y-5">
            <h2 className="text-lg font-black text-black">Designated Grievance Redressal Officer</h2>
            <p className="text-xs sm:text-sm text-black/70 leading-relaxed">
              If you have any grievance or complaint regarding user content, intellectual property violations, harassment, or non-compliance with the Information Technology Act, 2000, you may contact our designated Grievance Officer:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-black/5 space-y-1">
                <p className="font-bold text-black uppercase tracking-wider text-[11px] text-black/60">Designation</p>
                <p className="font-bold text-black text-sm">Grievance Redressal Officer</p>
                <p className="text-black/70">Meova Platforms Private Limited</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 space-y-1">
                <p className="font-bold text-black uppercase tracking-wider text-[11px] text-black/60">Email Address</p>
                <p className="font-bold text-[#7C3AED] text-sm">
                  <a href="mailto:grievance@meova.in" className="hover:underline">grievance@meova.in</a>
                </p>
                <p className="text-black/70">Monitored 7 days a week</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 space-y-1 sm:col-span-2">
                <p className="font-bold text-black uppercase tracking-wider text-[11px] text-black/60">Physical Address for Service of Notice</p>
                <p className="text-black leading-relaxed font-semibold">
                  Meova Campus Headquarters, NH-2 Highway Corridor, Mathura, Uttar Pradesh 281406, India.
                </p>
              </div>
            </div>
          </section>

          {/* SLA Response Commitment */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
              <Clock size={18} className="text-[#7C3AED]" />
              Response Time &amp; Resolution SLA
            </h2>
            <p>Under the statutory guidelines established by the Government of India:</p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>Acknowledgment within 24 Hours:</strong> We shall acknowledge the receipt of every grievance within twenty-four (24) hours of receipt.
              </li>
              <li>
                <strong>Disposal within 15 Days:</strong> Every grievance shall be investigated, acted upon, and formally redressed within fifteen (15) working days from the date of its receipt.
              </li>
              <li>
                <strong>Expedited Safety Review:</strong> Complaints concerning non-consensual imagery, sexual harassment, or impersonation receive immediate expedited triage within 24 hours.
              </li>
            </ul>
          </section>

          {/* Filing Instructions */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">How to File a Valid Grievance</h2>
            <p>To ensure swift investigation, please include the following details in your communication:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-xs">
              <li>Your registered Meova email address and full name.</li>
              <li>The username or profile link of the reported account or post.</li>
              <li>A clear description of the alleged violation or grievance.</li>
              <li>Supporting evidence (screenshots, chat logs, or timestamped transaction receipts).</li>
              <li>A statement confirming that the information provided is accurate and made in good faith.</li>
            </ul>
          </section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
