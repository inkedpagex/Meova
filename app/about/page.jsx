import Link from 'next/link';
import LegalFooter from '@/components/LegalFooter';
import { 
  Sparkles, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Coffee, 
  ArrowLeft, 
  ArrowRight, 
  Compass, 
  CheckCircle2, 
  Lock 
} from '@/lib/icons';

export const metadata = {
  title: 'About Us — Meova',
  description: 'Learn about Meova: our mission, values, and how we are building India’s most trusted campus social network and student meetup platform.',
  alternates: { canonical: 'https://meova.in/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#F1EEFB] selection:text-[#7657D9]">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-[#7657D9] tracking-wider uppercase">About</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-black/70 hover:text-black transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7657D9] text-white text-xs font-bold hover:bg-[#6848C9] active:bg-[#5B3FB3] transition-all whitespace-nowrap shadow-xs cursor-pointer"
            >
              <span>Join Your Campus</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto py-12 sm:py-16 px-4 sm:px-6 space-y-12">
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F1EEFB] text-[#7657D9] border border-[#D9D1F2] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Our Mission &amp; Story</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black leading-tight">
            Reinventing how Indian university students connect.
          </h1>
          <p className="text-base sm:text-lg text-black/70 font-medium leading-relaxed max-w-3xl">
            Meova was created to solve a singular problem: modern social apps are built for passive doomscrolling, disconnected from physical campus life. We built a high-trust, verified ecosystem where peers meet in real life, study together, and build lifelong university friendships.
          </p>
        </div>

        {/* ── Visual Stats / Highlights ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-1 text-center sm:text-left">
            <p className="text-3xl font-black text-black">Campus-First</p>
            <p className="text-xs font-bold text-black uppercase tracking-wider">Universities &amp; Colleges</p>
            <p className="text-xs text-black/60 font-medium pt-1">Connecting verified students across university campuses.</p>
          </div>

          <div className="p-6 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-1 text-center sm:text-left">
            <p className="text-3xl font-black text-black">100%</p>
            <p className="text-xs font-bold text-black uppercase tracking-wider">Verified Peers Only</p>
            <p className="text-xs text-black/60 font-medium pt-1">Strict student ID &amp; roll verification eliminates spam &amp; trolls.</p>
          </div>

          <div className="p-6 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-1 text-center sm:text-left">
            <p className="text-3xl font-black text-emerald-600">₹0 Spam</p>
            <p className="text-xs font-bold text-black uppercase tracking-wider">Zero Toxic Feeds</p>
            <p className="text-xs text-black/60 font-medium pt-1">Real coffee invites, library study groups, and student clubs.</p>
          </div>
        </div>

        {/* ── Story Section ─────────────────────────────────────────── */}
        <section className="p-7 sm:p-9 rounded-[28px] bg-white border border-black/10 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-black">
            <Compass size={20} />
            <h2 className="text-xl font-black text-black">The Genesis of Meova</h2>
          </div>
          <p className="text-sm text-black/80 font-medium leading-relaxed">
            In every university campus across India, thousands of talented engineers, designers, entrepreneurs, and artists walk past each other daily in canteens and libraries without ever knowing each other’s interests or projects. Existing social networks keep students glued to algorithmic videos instead of facilitating meaningful local collaborations.
          </p>
          <p className="text-sm text-black/80 font-medium leading-relaxed">
            Meova was engineered from the ground up to reverse this dynamic. With features like <strong>Campus Radar</strong>, students can announce when they are free at the campus café, find a study partner for tomorrow’s midterms, or organize a coding sprint in the lab. Everything happens in real time, between verified campus peers.
          </p>
        </section>

        {/* ── Four Core Pillars ──────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-2xl font-black text-black tracking-tight">Our Core Pillars</h2>
            <p className="text-xs font-bold text-black/60 uppercase tracking-wider">The design principles behind every feature</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pillar 1 */}
            <div className="p-6 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-black/5 text-black flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
              <h3 className="text-base font-black text-black">1. University-Exclusive Trust</h3>
              <p className="text-xs text-black/70 font-medium leading-relaxed">
                Meova is not a public internet forum. Every account is tied to an active university student profile with validated college credentials, ensuring your interactions remain safe and relevant to campus life.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coffee size={20} />
              </div>
              <h3 className="text-base font-black text-black">2. Offline-First Connections</h3>
              <p className="text-xs text-black/70 font-medium leading-relaxed">
                We measure success by how many meaningful face-to-face meetups happen at the college cafeteria or library, not by minutes spent mindlessly scrolling through an algorithmic feed.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="text-base font-black text-black">3. Collaborative Campus Circles</h3>
              <p className="text-xs text-black/70 font-medium leading-relaxed">
                Whether you want to build a robotics team, organize an open-mic night, or study for GATE and placements, Meova Circles give students the collective power to self-organize without institutional bureaucracy.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-[26px] bg-white border border-black/10 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F1EEFB] text-[#7657D9] flex items-center justify-center">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-black text-black">4. Privacy &amp; Data Dignity</h3>
              <p className="text-xs text-black/70 font-medium leading-relaxed">
                We operate under strict data hygiene. Direct chats automatically auto-delete after 7 days, your student ID documents are stored in encrypted private buckets, and we never sell student data to third-party ad brokers.
              </p>
            </div>
          </div>
        </div>

        {/* ── Community Standards Banner ────────────────────────────── */}
        <section className="p-7 sm:p-8 rounded-[28px] bg-black text-white space-y-4 border border-white/10 shadow-lg">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-emerald-400" />
            <h2 className="text-lg font-black text-white">Student Safety Is Non-Negotiable</h2>
          </div>
          <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
            We enforce a zero-tolerance policy against harassment, impersonation, hate speech, and uninvited private solicitations. Campus meetups are strictly mandated to take place at public, brightly lit campus spots. Any bad actor is instantly banned and reported to campus authorities.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/community-guidelines"
              className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              Read Community Guidelines
            </Link>
            <Link
              href="/grievance"
              className="px-4 py-2 rounded-full bg-black/20 text-white text-xs font-bold hover:bg-black/30 transition-colors border border-white/20 whitespace-nowrap"
            >
              Grievance Redressal Mechanism
            </Link>
          </div>
        </section>

        {/* ── Student Ambassador Invitation ─────────────────────────── */}
        <div className="p-7 sm:p-8 rounded-[28px] bg-white border border-black/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/60">Campus Leadership</span>
            <h3 className="text-xl font-black text-black">Lead Meova at Your University</h3>
            <p className="text-xs text-black/70 font-medium max-w-lg">
              Represent your college community, organize campus meetups, and earn exclusive perks and Sparks as a verified Campus Ambassador.
            </p>
          </div>
          <Link
            href="/ambassador"
            className="flex-shrink-0 px-6 py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-black/80 transition-all whitespace-nowrap shadow-xs"
          >
            Apply as Ambassador
          </Link>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
