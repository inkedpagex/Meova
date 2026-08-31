import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Meova',
  description: 'Terms and conditions for using the Meova campus social platform.',
};

export default function TermsPage() {
  return (
    <div className="max-w-[680px] mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all uppercase tracking-wider">
          ← Back
        </Link>
        <Link href="/login" className="px-5 py-2 rounded-full text-[12px] font-black text-white transition-all hover:opacity-90 active:scale-95 shadow-md" style={{ background: 'linear-gradient(135deg, #F05A00, #D94F00)' }}>
          Log In
        </Link>
      </div>
      <div className="rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-8 shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">Terms of Service</h1>
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Last updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Meova (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. These terms apply to all users, including hosts and guests.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">2. Eligibility</h2>
            <p>Meova is intended for enrolled students and individuals affiliated with educational institutions. You must be at least 18 years old to use this Platform. By using Meova, you represent that you meet these eligibility requirements.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">3. Platform Usage</h2>
            <p className="mb-2">You agree to use Meova only for lawful purposes and in a manner that does not infringe the rights of others. Prohibited activities include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>Harassment, bullying, or threatening other users</li>
              <li>Creating fake profiles or impersonating others</li>
              <li>Using the platform for illegal transactions</li>
              <li>Attempting to manipulate or bypass the Sparks payment system</li>
              <li>Spamming or sending unsolicited messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">4. Sparks Currency</h2>
            <p>Sparks are a virtual currency used within the Meova Platform. Sparks have no real-world monetary value outside the Platform and cannot be exchanged for cash except through the official Creator withdrawal system available to eligible hosts. All Spark purchases are final and non-refundable, except as described in our auto-refund policy.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">5. Campus Meetups & Bookings</h2>
            <p>When you book a campus meetup or session, Sparks are held in escrow until the meeting is confirmed via code verification. If a meeting does not occur within the scheduled time, Sparks will be automatically refunded to the guest. Hosts are responsible for honoring confirmed bookings.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">6. User Content</h2>
            <p>By posting content on Meova (profile information, reviews, posts), you grant Meova a non-exclusive, royalty-free license to display that content on the Platform. You retain ownership of your content. You are responsible for ensuring your content does not violate any laws or third-party rights.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">7. Limitation of Liability</h2>
            <p>Meova is provided &quot;as is&quot; without warranties of any kind. We are not responsible for the actions of users or for any damages arising from the use of the Platform. In no event shall Meova be liable for indirect, incidental, or consequential damages.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be communicated via the Platform. Continued use of Meova after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">9. Contact</h2>
            <p>For questions about these Terms, please contact us at <span className="font-bold text-[var(--primary)]">support@Meova.app</span></p>
          </section>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/privacy" className="text-xs font-bold text-[var(--primary)] hover:underline">Read our Privacy Policy →</Link>
      </div>
    </div>
  );
}
