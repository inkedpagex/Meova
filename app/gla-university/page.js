import Link from 'next/link';

export const metadata = {
  title: 'Meova for GLA University Students — Campus Meets, Gigs & Circles | Meova',
  description: 'Meova is the #1 campus social platform built for GLA University students in Mathura. Book coffee meets with peers, earn Sparks on campus gigs, and join student circles. Free to join.',
  keywords: [
    'GLA University campus app', 'GLA meet app', 'GLA University social network',
    'meetify GLA University', 'meetifyy GLA University', 'meetify alternative GLA', 'meetifyy alternative GLA', 'GLA campus meetup',
    'GLA University students connect', 'Meova GLA', 'campus networking GLA Mathura',
    'GLA University student gigs', 'GLA University circles', 'GLA student app 2026',
    'meet students GLA', 'GLA campus social media', 'campus app Mathura'
  ],
  alternates: { canonical: 'https://meova.in/gla-university' },
  openGraph: {
    title: 'Meova for GLA University — Campus Meets, Gigs & Student Circles',
    description: 'The campus platform built for GLA University students. Book 1-on-1 meetups, earn Sparks, and join circles. Free to join.',
    url: 'https://meova.in/gla-university',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Meova for GLA University' }],
  },
  robots: { index: true, follow: true },
};

export default function GLALandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#F05A00] text-xs font-black uppercase tracking-wider mb-6">
          Built for GLA University, Mathura
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 leading-tight mb-4">
          The Campus App Every<br />
          <span className="text-[#F05A00]">GLA University Student</span> Needs
        </h1>

        <p className="text-base text-zinc-600 font-medium leading-relaxed max-w-xl mx-auto mb-8">
          Meova is the #1 campus social platform for GLA University students — book 1-on-1 coffee meets
          with peers, earn Sparks on campus gigs, share moments, and join student circles. All in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-7 py-3 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] text-white font-black text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-95"
          >
            Join Free — GLA Students
          </Link>
          <Link
            href="/discover"
            className="px-7 py-3 rounded-2xl border-2 border-zinc-200 text-zinc-700 font-black text-sm hover:border-[#F05A00] hover:text-[#F05A00] transition-all"
          >
            Explore Campus Peers
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-5 pb-16">
        <h2 className="text-xl font-black text-zinc-950 text-center mb-8">
          Everything GLA Students Need on One Platform
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: '1-on-1 Campus Meetups',
              desc: 'Book a coffee meet or study session with any GLA University student. Secured with QR verification and Sparks escrow.',
              emoji: '☕',
              href: '/bookings',
            },
            {
              title: 'Campus Gigs & Earn Sparks',
              desc: 'Find freelance tasks posted by GLA students — logo design, coding help, content writing, photography and more.',
              emoji: '💼',
              href: '/gigs',
            },
            {
              title: 'GLA Student Circles',
              desc: 'Join circles for Coding Club, Tech Fest, Cultural Events, Sports teams, and more GLA campus communities.',
              emoji: '🔵',
              href: '/circles',
            },
            {
              title: 'Campus Moments Feed',
              desc: 'Share your campus life — hackathons, fests, projects and hangouts — with verified GLA University peers.',
              emoji: '📸',
              href: '/',
            },
          ].map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="block p-5 rounded-3xl border border-zinc-200 hover:border-orange-300 hover:shadow-md bg-white transition-all group"
            >
              <span className="text-2xl mb-3 block">{f.emoji}</span>
              <h3 className="font-black text-zinc-950 text-sm mb-1 group-hover:text-[#F05A00] transition-colors">
                {f.title}
              </h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Meova — competitor-agnostic positioning */}
      <section className="bg-orange-50 border-t border-orange-100 py-14">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-xl font-black text-zinc-950 mb-3">
            The Only Campus App Built for GLA University
          </h2>
          <p className="text-sm text-zinc-600 font-medium leading-relaxed mb-6">
            Meova is designed from the ground up for GLA University students in Mathura.
            QR-verified 1-on-1 meetups with Sparks escrow safety, campus freelance gigs
            to earn real money, real-time student circles, and a campus moments feed —
            everything your college life needs, all in one place.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] text-white font-black text-sm shadow-md shadow-orange-500/20 transition-all active:scale-95"
          >
            Join Free — GLA University
          </Link>
        </div>
      </section>

      {/* FAQ — targets "GLA meet" type long-tail queries */}
      <section className="max-w-2xl mx-auto px-5 py-16">
        <h2 className="text-xl font-black text-zinc-950 text-center mb-8">
          Frequently Asked Questions — GLA University Students
        </h2>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Is Meova available for GLA University students?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! Meova is built for GLA University students in Mathura, UP. Sign up free with your Google account and start connecting with verified campus peers instantly.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What makes Meova the best campus app for GLA University students?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Meova offers a complete campus ecosystem — QR-verified 1-on-1 meetups with Sparks escrow safety, campus gigs to earn money as a student, real-time student circles, and a campus moments feed. All specifically designed for GLA University students in Mathura.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I book a meetup with a GLA University student on Meova?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Go to Discover, find the GLA student you want to meet, tap "Meet" and pay Sparks to book. They accept and you both get a QR code and 6-digit PIN to confirm the physical meetup on campus.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I earn money as a GLA University student on Meova?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! GLA students can post or apply to campus gigs — logo design, coding help, tutoring, photography, content writing and more. Earn Sparks (campus currency) and withdraw real money to your bank or UPI.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What are Sparks on Meova?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: "Sparks are Meova's campus currency. You earn Sparks by completing gigs and hosting meetups. Sparks can be withdrawn to your bank account or UPI ID directly from the Meova Wallet.",
                  },
                },
              ],
            }),
          }}
        />

        <div className="space-y-4">
          {[
            {
              q: 'Is Meova available for GLA University students?',
              a: 'Yes! Meova is built specifically for GLA University students in Mathura, UP. Sign up free with your Google account.',
            },
            {
              q: 'What makes Meova the best campus app for GLA?',
              a: 'QR-verified meetups with Sparks escrow safety, campus gigs to earn real money, real-time circles, and a campus feed — all designed specifically for GLA University students.',
            },
            {
              q: 'How do I book a campus meetup on Meova?',
              a: 'Go to Discover → tap any GLA student → tap "Meet" → book with Sparks. Both get a QR code to verify the physical meetup.',
            },
            {
              q: 'Can I earn money as a GLA student on Meova?',
              a: 'Yes! Apply to campus gigs posted by peers — design, coding, tutoring, photography. Earn Sparks and withdraw to UPI or bank.',
            },
          ].map((item, i) => (
            <details
              key={i}
              className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden"
            >
              <summary className="p-4 font-black text-sm text-zinc-950 cursor-pointer group-open:text-[#F05A00] flex justify-between items-center">
                {item.q}
                <span className="text-zinc-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="px-4 pb-4 text-sm text-zinc-600 font-medium leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="bg-zinc-950 py-14">
        <div className="max-w-xl mx-auto px-5 text-center">
          <h2 className="text-xl font-black text-white mb-3">
            Join 1000+ GLA University Students on Meova
          </h2>
          <p className="text-sm text-zinc-400 font-medium mb-6">
            Free to join. Built exclusively for GLA University, Mathura.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] text-white font-black text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Structured Data for GLA University LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Meova',
            applicationCategory: 'SocialNetworkingApplication',
            operatingSystem: 'Web, Android, iOS',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
            description:
              'Meova is the campus social and meetup platform for GLA University students in Mathura — QR-verified meetups, campus gigs with Sparks escrow, student circles, and a campus moments feed.',
            url: 'https://meova.in',
            screenshot: 'https://meova.in/icon-512.png',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '120',
            },
            keywords:
              'GLA University app, campus meetup, student gigs, meetify alternative, meetifyy alternative, GLA student network, campus social Mathura',
          }),
        }}
      />
    </main>
  );
}
