import Link from 'next/link';
import { notFound } from 'next/navigation';
import LegalFooter from '@/components/LegalFooter';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCollegeBySlug, slugifyCollege } from '@/lib/collegeSlug';
import {
  Coffee,
  Users,
  Radio,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Zap,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Award,
  ChevronDown,
} from '@/lib/icons';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';
  const college = await getCollegeBySlug(slug, supabaseAdmin);

  if (!college) {
    return {
      title: 'College Community | Meova',
      description: 'Find verified batchmates and campus circles on Meova.',
    };
  }

  const collegeName = college.name;
  const cityName = college.city || 'Campus';
  const canonicalUrl = `https://meova.in/college/${slug}`;

  return {
    title: `Meova for ${collegeName} Students — Campus Meets & Circles | Meova`,
    description: `Meova is the #1 campus social platform built for ${collegeName} students in ${cityName}. Book 1-on-1 coffee meets, connect with batchmates, and join verified circles. Free to join.`,
    keywords: [
      `${collegeName} campus app`,
      `${collegeName} social platform`,
      `${collegeName} meetup`,
      `${collegeName} students connect`,
      `Meova ${cityName}`,
      'campus networking',
      'student circles',
      'campus coffee meets',
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `Meova for ${collegeName} — Campus Meets & Student Circles`,
      description: `Connect with verified batchmates at ${collegeName}. Book 1-on-1 meets, discover student circles, and see who's free on campus.`,
      url: canonicalUrl,
      siteName: 'Meova',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `Meova for ${collegeName}`,
        },
      ],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CollegePage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams?.slug || '';
  const refCode = resolvedSearchParams?.ref || '';

  const college = await getCollegeBySlug(slug, supabaseAdmin);

  if (!college) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-[24px] bg-black/5 text-[#1C1917] flex items-center justify-center mb-4">
          <GraduationCap size={32} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Campus Community Not Found</h1>
        <p className="text-sm text-black/70 max-w-md mb-6">
          We couldn't locate this college page. Check the URL or explore other active universities.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-black text-white text-sm font-bold whitespace-nowrap flex-shrink-0 transition-transform active:scale-95"
          >
            Go to Meova Home
          </Link>
          <Link
            href="/ambassador"
            className="px-6 py-3 rounded-full bg-white border border-black/10 text-black text-sm font-bold whitespace-nowrap flex-shrink-0 hover:bg-black/5 transition-colors"
          >
            Apply as Ambassador
          </Link>
        </div>
      </div>
    );
  }

  // Query live college statistics and ambassador from Supabase
  const [
    totalUsersRes,
    confirmedUsersRes,
    ambassadorRes,
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', college.id),
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', college.id)
      .eq('college_confirmed', true),
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, photo_url, branch, year, referral_code')
      .eq('college_id', college.id)
      .eq('is_ambassador', true)
      .limit(1)
      .maybeSingle(),
  ]);

  const totalMembers = totalUsersRes?.count || 0;
  const confirmedMembers = confirmedUsersRes?.count || 0;
  const ambassador = ambassadorRes?.data || null;

  // Active referral code to attach to CTA links
  const activeRef = refCode || ambassador?.referral_code || '';
  const signupHref = activeRef
    ? `/signup?ref=${encodeURIComponent(activeRef)}&college=${encodeURIComponent(college.id)}`
    : `/signup?college=${encodeURIComponent(college.id)}`;

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#7C3AED]/20 selection:text-[#7C3AED]">
      {/* ── Top Header Bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-black/60 tracking-wider uppercase truncate max-w-[180px] sm:max-w-none">
                {college.name}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-black/70 hover:text-black whitespace-nowrap flex-shrink-0 transition-colors"
            >
              Log in
            </Link>
            <Link
              href={signupHref}
              className="px-4 py-2 rounded-full border border-[#E7E5E4] text-[#1C1917] hover:bg-black/5 text-xs font-bold shadow-2xs whitespace-nowrap flex-shrink-0 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Join Campus</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6">
          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            {/* Campus Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/10 text-black/80 text-xs font-bold uppercase tracking-wider">
              <MapPin size={13} className="text-black/70" />
              <span>Built for {college.name}, {college.city}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.1]">
              The Campus Social App for <br className="hidden sm:inline" />
              <span className="text-[#7C3AED]">{college.name}</span>
            </h1>

            <p className="text-sm sm:text-base text-black/70 font-medium leading-relaxed max-w-xl mx-auto">
              Connect with verified batchmates on campus, book 1-on-1 coffee meets with QR verification,
              see who's free now, and join active student circles.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Link
                href={signupHref}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm shadow-xl shadow-[#7C3AED]/25 whitespace-nowrap flex-shrink-0 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Join with College Email</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white border border-black/10 hover:border-black/30 text-black font-bold text-sm whitespace-nowrap flex-shrink-0 transition-all flex items-center justify-center gap-2"
              >
                <span>Already a Member? Log In</span>
              </Link>
            </div>

            {/* Micro Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-bold text-black/70">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>100% Free Forever</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>Official College Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-emerald-600" />
                <span>Sparks Rewards Wallet</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Live Campus Stats Bar ──────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-[26px] bg-white border border-black/10 text-center shadow-xs">
              <p className="text-2xl sm:text-3xl font-black text-black">
                {totalMembers || 0}
              </p>
              <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wider">Students Joined</p>
            </div>

            <div className="p-5 rounded-[26px] bg-white border border-black/10 text-center shadow-xs">
              <p className="text-2xl sm:text-3xl font-black text-[#1C1917]">
                {confirmedMembers || 0}
              </p>
              <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wider">Verified Peers</p>
            </div>

            <div className="p-5 rounded-[26px] bg-white border border-black/10 text-center shadow-xs">
              <p className="text-2xl sm:text-3xl font-black text-black">
                {college.domain ? `@${college.domain}` : 'Official'}
              </p>
              <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wider">Campus Email</p>
            </div>

            <div className="p-5 rounded-[26px] bg-white border border-black/10 text-center shadow-xs">
              <div className="flex items-center justify-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-2xl sm:text-3xl font-black">Live</span>
              </div>
              <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wider">Campus Presence</p>
            </div>
          </div>
        </section>

        {/* ── Featured Campus Ambassador Banner ──────────────────────── */}
        {ambassador && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
            <div className="p-6 rounded-[28px] bg-white border border-black/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-black/5 border-2 border-black/20 flex-shrink-0">
                  {ambassador.photo_url ? (
                    <img
                      src={ambassador.photo_url}
                      alt={ambassador.full_name || 'Ambassador'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full font-bold text-lg text-black">
                      {(ambassador.full_name || 'A')[0]}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/5 text-black/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Award size={12} />
                    <span>Official Campus Ambassador</span>
                  </div>
                  <h3 className="font-bold text-base text-black">{ambassador.full_name}</h3>
                  <p className="text-xs text-black/60">
                    {ambassador.branch ? `${ambassador.branch} · ` : ''}{college.name}
                  </p>
                </div>
              </div>

              <Link
                href={signupHref}
                className="px-4 py-2 rounded-full border border-[#E7E5E4] text-[#1C1917] hover:bg-black/5 text-xs font-bold shadow-2xs whitespace-nowrap flex-shrink-0 transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span>Connect with {ambassador.full_name?.split(' ')[0]}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </section>
        )}

        {/* ── 3 Core Pillars (Clean UI_RULES compliant Cards) ─────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              Designed Exclusively for {college.name}
            </h2>
            <p className="text-xs sm:text-sm text-black/60 font-medium mt-1.5">
              Everything you need for an active and rewarding campus experience
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Card 1: 1-on-1 Campus Meets */}
            <div className="p-6 rounded-[28px] bg-white border border-black/10 hover:border-black/30 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-black/5 text-[#1C1917] flex items-center justify-center mb-5">
                  <Coffee size={24} />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">1-on-1 Campus Meets</h3>
                <p className="text-xs text-black/70 leading-relaxed font-medium">
                  Book verified coffee meets or study sessions at campus cafes and libraries with QR code check-in and security PIN verification.
                </p>
              </div>
              <div className="pt-6 border-t border-black/5 mt-6 flex items-center justify-between text-xs font-bold text-black">
                <span>Verified Meetups</span>
                <CheckCircle2 size={14} className="text-emerald-600" />
              </div>
            </div>

            {/* Card 2: Campus Radar */}
            <div className="p-6 rounded-[28px] bg-white border border-black/10 hover:border-black/30 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-black/5 text-[#1C1917] flex items-center justify-center mb-5">
                  <Radio size={24} />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Live Campus Radar</h3>
                <p className="text-xs text-black/70 leading-relaxed font-medium">
                  Broadcast your presence when you are free between lectures. Discover which classmates are studying at the library or hanging at the canteen.
                </p>
              </div>
              <div className="pt-6 border-t border-black/5 mt-6 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Real-Time Presence</span>
                <Zap size={14} />
              </div>
            </div>

            {/* Card 3: Student Circles */}
            <div className="p-6 rounded-[28px] bg-white border border-black/10 hover:border-black/30 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-black/5 text-[#1C1917] flex items-center justify-center mb-5">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Student Circles &amp; Clubs</h3>
                <p className="text-xs text-black/70 leading-relaxed font-medium">
                  Join student-run communities for competitive coding, design, cultural societies, hackathons, and sports teams across departments.
                </p>
              </div>
              <div className="pt-6 border-t border-black/5 mt-6 flex items-center justify-between text-xs font-bold text-black">
                <span>Active Communities</span>
                <Sparkles size={14} className="text-emerald-600" />
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ─────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-black/60 font-medium mt-1">
              Common questions from {college.name} students
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: `Is Meova free for all ${college.name} students?`,
                a: `Yes! Meova is 100% free for all students at ${college.name}. You can sign up with your Google account or college email address.`,
              },
              {
                q: 'How does college verification work?',
                a: 'Students can verify their student status by connecting their institutional email address or uploading their student ID for manual approval by the campus lead.',
              },
              {
                q: 'How do campus meetups work?',
                a: 'Find batchmates on the Discover radar, send a meetup invite for coffee or study session, and meet safely in public campus areas with QR check-in verification.',
              },
              {
                q: 'How can I become a Campus Ambassador?',
                a: `If you want to represent ${college.name} and earn exclusive Sparks rewards, visit our Ambassador page to apply for your campus.`,
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white border border-black/10 rounded-[22px] overflow-hidden transition-colors"
              >
                <summary className="p-4 sm:p-5 font-bold text-sm text-black cursor-pointer group-open:text-black flex justify-between items-center select-none">
                  <span>{faq.q}</span>
                  <ChevronDown size={16} className="text-black/40 group-open:rotate-180 transition-transform shrink-0 ml-2" />
                </summary>
                <p className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA Banner ───────────────────────────────────────── */}
        <section className="bg-black text-white py-16 px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Join {college.name} on Meova?
            </h2>
            <p className="text-xs sm:text-sm text-white/70 font-medium">
              Start connecting with your peers today. 100% free forever.
            </p>
            <div className="pt-2">
              <Link
                href={signupHref}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm shadow-xl shadow-[#7C3AED]/30 whitespace-nowrap flex-shrink-0 transition-transform active:scale-95"
              >
                <span>Create Free Campus Account</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Standard Legal & Compliance Footer ──────────────────────── */}
      <LegalFooter />

      {/* ── Structured Data (JSON-LD) ───────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'EducationalOrganization',
                name: college.name,
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: college.city || 'India',
                  addressRegion: college.state || 'India',
                  addressCountry: 'IN',
                },
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Meova',
                applicationCategory: 'SocialNetworkingApplication',
                operatingSystem: 'Web, Android, iOS',
                description: `Meova is the campus social network for ${college.name} students — verified meetups, student circles, and live presence.`,
                url: `https://meova.in/college/${slug}`,
                screenshot: 'https://meova.in/icon-512.png',
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.8',
                  reviewCount: '120',
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
