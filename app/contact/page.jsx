import Link from 'next/link';
import LegalFooter from '@/components/LegalFooter';
import ContactForm from './ContactForm';
import { Mail, ArrowLeft, Sparkles } from '@/lib/icons';

export const metadata = {
  title: 'Contact Us — Meova Campus Support',
  description: 'Get in touch with the Meova campus support team for inquiries, account help, and student feedback.',
  alternates: { canonical: 'https://meova.in/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#7C3AED]/20 selection:text-[#7C3AED] flex flex-col justify-between">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-[#7C3AED] tracking-wider uppercase">Contact</span>
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

      {/* ── Focused Single-Column Main Content ──────────────────────── */}
      <main className="max-w-xl mx-auto w-full py-10 sm:py-14 px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Meova Support Desk</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Contact Us
          </h1>

          <p className="text-sm text-black/70 font-medium leading-relaxed max-w-md mx-auto">
            Have a question, feedback, or need help? Send us a message below or email us directly at{' '}
            <a href="mailto:support@meova.in" className="font-bold text-[#7C3AED] hover:underline">
              support@meova.in
            </a>
            .
          </p>
        </div>

        {/* The Clean Contact Form */}
        <ContactForm />

        {/* Discreet Legal Grievance Link */}
        <p className="text-center text-xs text-black/50 font-medium pt-2">
          Need statutory legal or grievance reporting?{' '}
          <Link href="/grievance" className="font-bold text-[#7C3AED] hover:underline">
            Grievance Redressal Portal →
          </Link>
        </p>
      </main>

      <LegalFooter />
    </div>
  );
}
