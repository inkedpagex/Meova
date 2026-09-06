import Link from 'next/link';
import LegalFooter from '@/components/LegalFooter';
import { RefreshCw, Wallet, Clock, CheckCircle2, AlertCircle, ArrowLeft } from '@/lib/icons';

export const metadata = {
  title: 'Refund & Cancellation Policy — Meova',
  description: 'Understand Meova policies on Sparks recharges, decimal verification reservations, escrow auto-refunds, and ₹500 minimum withdrawals.',
  alternates: { canonical: 'https://meova.in/refund-policy' },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#7C3AED]/20 selection:text-[#7C3AED]">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-[#7C3AED] tracking-wider uppercase">Refunds</span>
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
            <RefreshCw size={13} />
            <span>Billing &amp; Payout Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
            Effective Date: September 2026 · Version 2026.1
          </p>
        </div>

        <div className="space-y-10 text-sm text-black/80 leading-relaxed font-medium">
          {/* Section 1 */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">1. Overview of the Sparks Wallet System</h2>
            <p>
              Meova utilizes digital credits called <strong>Sparks</strong> to facilitate campus bookings, tipping, and club activities. Before initiating a recharge or withdrawal, please review our strict currency distinction:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Purchased Balance (Non-Withdrawable)
                </p>
                <p>
                  Sparks added via UPI recharge are intended strictly for in-app services. Once purchased, they <strong>cannot be withdrawn or refunded to bank accounts</strong>.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
                <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Earned Balance (Withdrawable)
                </p>
                <p>
                  Sparks earned by hosting verified coffee meets, campus ambassador rewards, or peer tips are <strong>100% withdrawable</strong> to your UPI ID.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Manual UPI Recharges */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">2. UPI Recharges &amp; Decimal Reservations</h2>
            <p>
              To eliminate gateway commissions for students, Meova employs a zero-fee manual UPI recharge protocol using precise decimal reservations (e.g. ₹100.24).
            </p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>Verification Timeline:</strong> Recharges are reviewed against bank statements typically within <strong>15 to 30 minutes</strong> during campus operational hours (8:00 AM – 11:00 PM IST).
              </li>
              <li>
                <strong>Failed or Rejected Recharges:</strong> If you cancel your payment or fail to transfer the exact reserved decimal amount within 15 minutes, the reservation expires automatically and releases the decimal back to the pool. No fee is charged.
              </li>
              <li>
                <strong>Payment Mismatches:</strong> If you transfer an incorrect amount, our finance team will match the UTR reference. If untraceable, contact billing@meova.in with your UPI transaction receipt.
              </li>
            </ul>
          </section>

          {/* Section 3: Meetup Escrow Auto-Refunds */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">3. Campus Meetup Cancellations &amp; Auto-Refunds</h2>
            <p>
              All Sparks committed to 1-on-1 coffee meets or study sessions are protected by automated escrow:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>Host Declines or Cancels:</strong> If the host declines or cancels a meet request before the scheduled time, 100% of the held Sparks are <strong>immediately refunded</strong> to the guest's wallet balance.
              </li>
              <li>
                <strong>No-Show or Unverified Meetup:</strong> If either party fails to meet or the QR code / security PIN is not scanned within 30 minutes of the scheduled time, the meetup expires and Sparks held in escrow are auto-refunded to the guest.
              </li>
              <li>
                <strong>Completed Meetups:</strong> Once both students scan and confirm attendance via QR code, the meetup is deemed completed and the escrow is released to the host. Completed meetups are strictly <strong>non-refundable</strong>.
              </li>
            </ul>
          </section>

          {/* Section 4: Withdrawals */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">4. Withdrawal Rules &amp; Minimum Thresholds</h2>
            <p>
              Students cashing out their earned Sparks must comply with standard financial compliance guidelines:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-1 text-xs">
              <li>
                <strong>Minimum Withdrawal:</strong> The minimum withdrawal amount is <strong>₹500</strong> (500 earned Sparks).
              </li>
              <li>
                <strong>Processing Time:</strong> Withdrawal requests are processed to your registered UPI ID within <strong>24 to 48 hours</strong>, following anti-fraud validation.
              </li>
              <li>
                <strong>Disputed Accounts:</strong> Accounts with active safety flags or disputed meeting reports cannot withdraw funds until moderation reviews conclude.
              </li>
            </ul>
          </section>

          {/* Section 5: Contact Billing */}
          <section className="space-y-3 p-6 sm:p-7 rounded-[26px] bg-white border border-black/10 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-black">5. Billing Assistance &amp; Dispute Escalation</h2>
            <p>
              For any recharge queries, UTR reconciliation, or withdrawal delays, please contact our financial desk directly:
            </p>
            <p className="text-xs font-bold text-black">
              Email: <a href="mailto:billing@meova.in" className="text-[#7C3AED] underline">billing@meova.in</a>
            </p>
          </section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
