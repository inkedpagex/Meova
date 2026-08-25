import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Meetuply',
  description: 'How Meetuply collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">Privacy Policy</h1>
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Last updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect the following information when you use Meetuply:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li><strong>Account Information:</strong> Name, email address, profile photo, year, branch, and interests</li>
              <li><strong>Transaction Data:</strong> Sparks purchases, booking history, and wallet activity</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, and interaction patterns (anonymized)</li>
              <li><strong>Device Data:</strong> Browser type, IP address, and device identifiers for security purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>To provide and improve the Meetuply Platform</li>
              <li>To facilitate bookings and Sparks transactions</li>
              <li>To send you notifications about your bookings and account activity</li>
              <li>To ensure platform safety and prevent fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs mt-2">
              <li><strong>Other Users:</strong> Your public profile (name, photo, interests, reviews) is visible to other logged-in users</li>
              <li><strong>Firebase/Google:</strong> Our database and authentication provider (Google LLC)</li>
              <li><strong>Cloudinary:</strong> Image hosting for profile photos</li>
              <li><strong>Law Enforcement:</strong> When legally required to do so</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">4. Data Storage & Security</h2>
            <p>Your data is stored in Firebase Firestore (Google Cloud), which provides enterprise-grade security. We use secure HTTPS connections and HTTP-only session cookies. We never store raw payment details — only Sparks balances and transaction records.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">5. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>Access your personal data by viewing your profile</li>
              <li>Update or correct your information in Profile settings</li>
              <li>Request deletion of your account by contacting us</li>
              <li>Withdraw consent for notifications at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">6. Cookies</h2>
            <p>We use a single HTTP-only session cookie (<code className="text-xs bg-[var(--bg-surface)] px-1 rounded">__Meova_session</code>) to keep you logged in. This cookie expires after 5 days and is deleted when you log out. We do not use third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">7. Children&apos;s Privacy</h2>
            <p>Meetuply is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal information, we will delete it immediately.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes via the Platform. Your continued use of Meetuply after changes constitutes your acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">9. Contact Us</h2>
            <p>For privacy-related questions or data deletion requests, contact us at <span className="font-bold text-[var(--primary)]">privacy@Meova.app</span></p>
          </section>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/terms" className="text-xs font-bold text-[var(--primary)] hover:underline">Read our Terms of Service →</Link>
      </div>
    </div>
  );
}
