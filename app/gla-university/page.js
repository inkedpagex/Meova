import Link from 'next/link';
import Image from 'next/image';
import {
  Coffee, Briefcase, Users, Camera, ChevronDown, Sparkles,
  ShieldCheck, ArrowRight, Zap, CheckCircle2, GraduationCap, MapPin
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-[#F05A00]/20 selection:text-[#F05A00]">
      {/* ── Top Navigation Bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#F05A00] flex items-center justify-center text-white shadow-md shadow-orange-500/25">
              <span className="font-black text-lg">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-zinc-950 leading-none">Meova</span>
              <span className="text-[10px] font-bold text-[#F05A00] tracking-wider uppercase">GLA University</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/discover" className="text-xs font-bold text-zinc-600 hover:text-[#F05A00] transition-colors">
              Discover Peers
            </Link>
            <Link href="/gigs" className="text-xs font-bold text-zinc-600 hover:text-[#F05A00] transition-colors">
              Campus Gigs
            </Link>
            <Link href="/circles" className="text-xs font-bold text-zinc-600 hover:text-[#F05A00] transition-colors">
              Circles
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-black text-zinc-700 hover:text-[#F05A00] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-[#F05A00] hover:bg-[#D94F00] text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Join Free</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-200/40 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#F05A00] text-xs font-black uppercase tracking-wider shadow-2xs">
              <MapPin size={13} className="text-[#F05A00]" />
              <span>Built Exclusively for GLA University, Mathura</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight leading-[1.15]">
              The Campus Social App Every <br className="hidden sm:inline" />
              <span className="text-[#F05A00]">GLA Student</span> Needs
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 font-medium leading-relaxed max-w-xl mx-auto">
              Connect with verified batchmates, book 1-on-1 coffee meets with QR verification,
              earn Sparks on campus freelance gigs, and join active student circles.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] text-white font-black text-sm shadow-xl shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Join with College Email</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/discover"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white border border-zinc-200 hover:border-[#F05A00] text-zinc-800 font-black text-sm hover:text-[#F05A00] shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                <span>Explore GLA Peers</span>
              </Link>
            </div>

            {/* Micro Social Proof */}
            <div className="flex items-center justify-center gap-6 pt-4 text-xs font-bold text-zinc-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#F05A00]" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#F05A00]" />
                <span>Verified Students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#F05A00]" />
                <span>Sparks Wallet</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Grid ───────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              Everything GLA Students Need in One App
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1.5">
              Built by students, for students at GLA University Mathura
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: '1-on-1 Campus Meets',
                desc: 'Book verified coffee meets or study sessions on campus with QR & PIN security.',
                icon: Coffee,
                href: '/bookings',
                badge: 'Verified',
              },
              {
                title: 'Campus Gigs & Sparks',
                desc: 'Earn Sparks on logo design, coding help, tutoring, and photography gigs.',
                icon: Briefcase,
                href: '/gigs',
                badge: 'Earn Money',
              },
              {
                title: 'GLA Student Circles',
                desc: 'Join coding clubs, tech fest squads, cultural groups, and sports communities.',
                icon: Users,
                href: '/circles',
                badge: 'Clubs',
              },
              {
                title: 'Campus Moments Feed',
                desc: 'Share campus stories, hackathons, and moments with verified peers.',
                icon: Camera,
                href: '/',
                badge: 'Feed',
              },
            ].map((f) => {
              const IconComp = f.icon;
              return (
                <Link
                  key={f.title}
                  href={f.href}
                  className="group p-6 rounded-3xl bg-white border border-zinc-200/90 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#F05A00] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComp size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 group-hover:bg-orange-100 group-hover:text-[#F05A00] transition-colors">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="font-black text-zinc-950 text-sm mb-1.5 group-hover:text-[#F05A00] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-1 text-xs font-bold text-[#F05A00] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore</span>
                    <ArrowRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Why Meova Spotlight ─────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-orange-500 to-[#D94F00] text-white py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center mx-auto">
              <Zap size={24} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              A Complete Social Ecosystem for GLA University
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed max-w-xl mx-auto">
              Unlike generic social networks, Meova is tailor-made for campus life in Mathura.
              Safe physical meetups with QR verification, verified student profiles, and real rewards in your Sparks Wallet.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-zinc-950 font-black text-sm shadow-xl hover:bg-zinc-100 transition-all active:scale-95"
              >
                <span>Get Started Now</span>
                <ArrowRight size={15} className="text-[#F05A00]" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ─────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
              Common questions from GLA University students
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Is Meova available for all GLA University students?',
                a: 'Yes! Any student from GLA University (B.Tech, BCA, MCA, MBA, B.Sc, Diploma, etc.) in Mathura can join for free with their Google account.',
              },
              {
                q: 'How do campus meetups work on Meova?',
                a: 'Browse verified GLA students on Discover, request a coffee or study meet, and once accepted, both users get a unique QR code to scan and verify the physical meetup on campus.',
              },
              {
                q: 'How do I earn Sparks on campus gigs?',
                a: 'Students post tasks like graphic design, coding assistance, tutoring, or event photography. Complete the task, get Sparks credited to your wallet, and withdraw directly via UPI or bank transfer.',
              },
              {
                q: 'Is my data safe and private?',
                a: 'Yes, Meova uses secure authentication, end-to-end encrypted session tokens, and never shares personal phone numbers or private data without your consent.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white border border-zinc-200/90 rounded-2xl overflow-hidden transition-colors"
              >
                <summary className="p-4 sm:p-5 font-black text-sm text-zinc-950 cursor-pointer group-open:text-[#F05A00] flex justify-between items-center select-none">
                  <span>{item.q}</span>
                  <ChevronDown size={16} className="text-zinc-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
                </summary>
                <p className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────── */}
        <section className="bg-zinc-950 text-white py-16 px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Join GLA University on Meova
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium">
              Start connecting with your campus peers today. Free forever.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] text-white font-black text-sm shadow-xl shadow-orange-500/25 transition-all active:scale-95"
              >
                <span>Create Free Account</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-zinc-200/80 py-8 px-4 sm:px-6 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
          <p>© {new Date().getFullYear()} Meova.in — Built for GLA University, Mathura.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-[#F05A00] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#F05A00] transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-[#F05A00] transition-colors">Log In</Link>
          </div>
        </div>
      </footer>

      {/* ── Structured Data FAQ & SoftwareApp ──────────────────────── */}
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
    </div>
  );
}

