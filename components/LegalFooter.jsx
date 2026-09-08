import Link from 'next/link';

export default function LegalFooter({ className = '' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-white border-t border-black/10 text-black font-sans ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Meova Logo" className="h-7 w-auto object-contain" />
              <span className="font-black text-xl tracking-tight text-black">Meova</span>
            </div>
            <p className="text-xs text-black/70 leading-relaxed font-medium">
              The verified social network and peer meetup ecosystem for Indian university students.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1EEFB] text-[#7657D9] border border-[#D9D1F2] text-[10px] font-bold uppercase tracking-wider">
              <span>Made for Indian Campuses</span>
            </div>
          </div>

          {/* Col 2: Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">Legal &amp; Policy</h4>
            <ul className="space-y-2 text-xs font-medium text-black/70">
              <li>
                <Link href="/terms" className="hover:text-black transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-black transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-black transition-colors">
                  Refund &amp; Cancellation
                </Link>
              </li>
              <li>
                <Link href="/grievance" className="hover:text-black transition-colors">
                  Grievance Redressal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Community & Safety */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">Community &amp; Safety</h4>
            <ul className="space-y-2 text-xs font-medium text-black/70">
              <li>
                <Link href="/community-guidelines" className="hover:text-black transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/ambassador" className="hover:text-black transition-colors">
                  Campus Ambassador
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-black transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-black transition-colors">
                  Campus Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">Company</h4>
            <ul className="space-y-2 text-xs font-medium text-black/70">
              <li>
                <Link href="/about" className="hover:text-black transition-colors">
                  About Meova
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-black transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-black transition-colors">
                  Student Log In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-black transition-colors">
                  Join Campus
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer bottom bar */}
        <div className="pt-8 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-black/60 font-medium">
          <p>© {currentYear} Meova.in. All rights reserved. Built for Indian University Campuses.</p>
          <div className="flex items-center gap-4 text-black/70">
            <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/grievance" className="hover:text-black transition-colors">Grievance</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-black transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
