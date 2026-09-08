'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Award, 
  TrendingUp, 
  Shield, 
  ChevronRight, 
  Star, 
  Zap, 
  BookOpen, 
  CheckCircle2,
  Building2, 
  Calendar,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  User,
  Mail,
  Phone,
  GraduationCap,
  Instagram,
  Linkedin,
  MapPin,
  Loader2,
  X,
  AlertCircle,
  ShieldCheck,
  Radio,
  Check
} from '@/lib/icons';
import CustomSelect from '@/components/CustomSelect';
import LegalFooter from '@/components/LegalFooter';

const PERKS = [
  {
    icon: <Award className="w-5 h-5" />,
    title: 'Official Certificate & LOR',
    desc: 'Receive an official Meova Campus Ambassador certificate and verified Letter of Recommendation for top performers.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Campus Moderation Power',
    desc: 'Lead your university ecosystem — verify genuine students from your college and maintain campus standards.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Dedicated Growth Dashboard',
    desc: 'Real-time analytics on new signups, verified peers, and student engagement at your campus.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Exclusive Swag & Rewards',
    desc: 'Custom Meova ambassador hoodies, stickers, notebooks, and performance milestone awards.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Direct Leadership Access',
    desc: 'Work directly with the Meova founding team, participate in product discussions, and preview features first.',
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: 'Resume Booster',
    desc: 'Demonstrate real community leadership, brand ambassadorship, and product growth on your CV.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Apply & Get Shortlisted',
    desc: 'Submit your campus leadership application. Our team reviews submissions within 48 hours.',
    icon: <GraduationCap className="w-7 h-7 text-[#1C1917]" />,
  },
  {
    number: '02',
    title: 'Lead Your Campus',
    desc: 'Verify genuine students from your college, host physical meetups, and nurture student circles.',
    icon: <Shield className="w-7 h-7 text-[#1C1917]" />,
  },
  {
    number: '03',
    title: 'Unlock Rewards & LOR',
    desc: 'Earn exclusive Meova swag, official Letter of Recommendation, and verified leadership credentials.',
    icon: <Award className="w-7 h-7 text-[#1C1917]" />,
  },
];

const FAQS = [
  {
    q: 'Who is eligible to apply?',
    a: 'Any full-time undergraduate or postgraduate student currently enrolled at a recognized university or college in Uttar Pradesh.',
  },
  {
    q: 'How much time commitment is required?',
    a: 'Approximately 2 to 4 hours per week. It is completely flexible around your classes, projects, and exam schedules.',
  },
  {
    q: 'What if my college is not in the list?',
    a: 'You can still apply! Select "Other University" and enter your college name. Our team evaluates and adds new campuses regularly.',
  },
  {
    q: 'How are ambassadors selected?',
    a: 'We review your background, campus involvement, and answers to why you want to represent Meova. Shortlisted students are notified within 48 hours.',
  },
];

const FIELD_LIMITS = {
  full_name: 50,
  college_name: 80,
  email: 60,
  phone: 15,
  year: 20,
  branch: 40,
  instagram_handle: 30,
  linkedin_url: 80,
  why_ambassador: 150,
  meeting_locations: 150,
};

export default function AmbassadorLandingPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    college_id: '',
    college_name: '',
    full_name: '',
    email: '',
    phone: '',
    year: '',
    branch: '',
    why_ambassador: '',
    instagram_handle: '',
    linkedin_url: '',
    meeting_locations: '',
  });

  const updateField = (field, value) => {
    const limit = FIELD_LIMITS[field];
    const cleanVal = limit && typeof value === 'string' ? value.slice(0, limit) : value;
    setForm(f => ({ ...f, [field]: cleanVal }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (error) setError('');
  };

  useEffect(() => {
    // Check existing application status or admin session
    fetch('/api/ambassador/apply')
      .then(r => r.json())
      .then(d => {
        setApplicationStatus(d.status);
        if (d.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});

    // Load colleges list
    fetch('/api/colleges')
      .then(r => r.json())
      .then(d => setColleges(d.colleges || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = {};
    if (!form.full_name?.trim() || form.full_name.trim().length < 2) {
      errors.full_name = 'Please enter your full name (min 2 chars)';
    } else if (form.full_name.trim().length > FIELD_LIMITS.full_name) {
      errors.full_name = `Name must not exceed ${FIELD_LIMITS.full_name} characters`;
    }

    if (!form.college_id) {
      errors.college_id = 'Please select your college / university';
    } else if (form.college_id === 'other') {
      if (!form.college_name?.trim() || form.college_name.trim().length < 2) {
        errors.college_name = 'Please enter your university name';
      } else if (form.college_name.trim().length > FIELD_LIMITS.college_name) {
        errors.college_name = `University name must not exceed ${FIELD_LIMITS.college_name} characters`;
      }
    }

    if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    } else if (form.email.trim().length > FIELD_LIMITS.email) {
      errors.email = `Email must not exceed ${FIELD_LIMITS.email} characters`;
    }

    const cleanPhone = (form.phone || '').replace(/[\s\-\+]/g, '');
    if (!form.phone?.trim() || cleanPhone.length < 10) {
      errors.phone = 'Please enter a valid 10-digit WhatsApp number';
    } else if (form.phone.trim().length > FIELD_LIMITS.phone) {
      errors.phone = `Phone number must not exceed ${FIELD_LIMITS.phone} characters`;
    }

    if (form.year && form.year.trim().length > FIELD_LIMITS.year) {
      errors.year = `Study year must not exceed ${FIELD_LIMITS.year} characters`;
    }

    if (form.branch && form.branch.trim().length > FIELD_LIMITS.branch) {
      errors.branch = `Course / branch must not exceed ${FIELD_LIMITS.branch} characters`;
    }

    if (form.instagram_handle && form.instagram_handle.trim().length > FIELD_LIMITS.instagram_handle) {
      errors.instagram_handle = `Instagram handle must not exceed ${FIELD_LIMITS.instagram_handle} characters`;
    }

    if (form.linkedin_url && form.linkedin_url.trim().length > FIELD_LIMITS.linkedin_url) {
      errors.linkedin_url = `LinkedIn URL must not exceed ${FIELD_LIMITS.linkedin_url} characters`;
    }

    if (!form.why_ambassador?.trim() || form.why_ambassador.trim().length < 20) {
      errors.why_ambassador = `Please write at least 20 characters (currently ${form.why_ambassador?.trim().length || 0}/150)`;
    } else if (form.why_ambassador.trim().length > FIELD_LIMITS.why_ambassador) {
      errors.why_ambassador = `Maximum ${FIELD_LIMITS.why_ambassador} characters allowed`;
    }

    if (form.meeting_locations && form.meeting_locations.trim().length > FIELD_LIMITS.meeting_locations) {
      errors.meeting_locations = `Meeting locations must not exceed ${FIELD_LIMITS.meeting_locations} characters`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please review the highlighted fields above before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/ambassador/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          meeting_locations: form.meeting_locations.split('\n').map(s => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.');
      } else {
        setSubmitted(true);
        setApplicationStatus('pending');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const collegeOptions = colleges.map(c => ({
    value: c.id,
    label: `${c.name}${c.city ? ` (${c.city})` : ''}`,
  }));

  return (
    <div className="min-h-screen bg-white text-black font-inter selection:bg-[#F1EEFB] selection:text-[#7657D9]">
      {/* ── Standalone Navigation Bar ───────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Meova Logo" className="h-7 sm:h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-black leading-none">Meova</span>
              <span className="text-[10px] font-bold text-black/60 tracking-wider uppercase">Ambassadors</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-black/70">
            <a href="#steps" className="hover:text-black transition-colors">How It Works</a>
            <a href="#perks" className="hover:text-black transition-colors">Perks</a>
            <a href="#faqs" className="hover:text-black transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAdmin || applicationStatus === 'approved' ? (
              <Link
                href="/ambassador/dashboard"
                className="border border-[#E7E5E4] text-[#1C1917] hover:bg-black/5 text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 active:scale-95 transition-all shadow-2xs"
              >
                Open Dashboard
              </Link>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="border border-[#E7E5E4] text-[#1C1917] hover:bg-black/5 text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section (Edge-to-Edge Dark Slate) ──────────────────── */}
      <section className="relative overflow-hidden bg-black text-white pt-20 pb-28 px-4 sm:px-6">
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)' 
          }}
        />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold tracking-wide uppercase">Campus Ambassador Cohort 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] mb-6">
            Lead your campus.<br />
            <span className="text-[#7657D9]">Shape student life.</span>
          </h1>

          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Become the official student leader representing Meova at your university. Drive peer connections, moderate campus safety, and build leadership skills that set you apart.
          </p>

          {isAdmin || applicationStatus === 'approved' ? (
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white/10 border border-white/20 rounded-[22px] p-5 max-w-md mx-auto text-left">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-white">
                  {isAdmin ? 'Super Admin Access Active' : 'Ambassador Status Approved'}
                </p>
                <p className="text-xs text-white/80 mt-0.5">
                  Access your live campus moderation dashboard and student directory.
                </p>
              </div>
              <Link
                href="/ambassador/dashboard"
                className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
              >
                Dashboard
              </Link>
            </div>
          ) : applicationStatus === 'pending' ? (
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/15 rounded-full px-6 py-3 text-sm text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
              <span className="font-semibold">Your application is under review. We will notify you within 48 hours.</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
              <button
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white font-bold px-8 py-3.5 rounded-full whitespace-nowrap flex-shrink-0 active:scale-95 transition-all shadow-sm shadow-[#7657D9]/12 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                Apply for Your Campus <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#steps"
                className="w-full sm:w-auto border border-white/20 text-white font-semibold px-7 py-3.5 rounded-full whitespace-nowrap flex-shrink-0 hover:bg-white/10 active:scale-95 transition-all text-sm cursor-pointer"
              >
                Learn More
              </a>
            </div>
          )}

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-white/10 text-left">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">Verified</p>
              <p className="text-xs font-semibold text-white/80 mt-1">Campus Leadership</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
              <p className="text-xs font-semibold text-white/80 mt-1">Student-Run Ecosystem</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">48 hrs</p>
              <p className="text-xs font-semibold text-white/80 mt-1">Fast Application Review</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">Tiered</p>
              <p className="text-xs font-semibold text-white/80 mt-1">Growth &amp; Rewards Path</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Simple Steps Section (Matches Streetwear Design) ─────── */}
      <section id="steps" className="px-4 sm:px-6 lg:px-16 py-20 bg-white border-b border-black/10 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
              3 simple steps to lead, connect & grow
            </h2>
            <p className="text-sm font-semibold text-black/70 mt-2">
              From application to university leadership in under 48 hours.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 md:gap-3 relative">
            {STEPS.map((step, idx) => (
              <div key={step.number} className="flex-1 flex flex-col md:flex-row items-center gap-3">
                {/* Step Card */}
                <div className="bg-white rounded-[28px] border border-black/10 shadow-xs hover:shadow-md p-6 flex items-center gap-5 relative w-full min-h-[160px] group transition-all">
                  {/* Floating Step Badge */}
                  <div className="absolute -top-3.5 left-6 w-7 h-7 rounded-full bg-[#1C1917] text-white font-bold text-xs flex items-center justify-center shadow-md z-20">
                    {step.number}
                  </div>

                  {/* Icon Container */}
                  <div className="w-16 h-16 rounded-full bg-black/5 border border-black/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {step.icon}
                  </div>

                  {/* Text Content */}
                  <div>
                    <h3 className="text-base font-bold text-black mb-1 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-black/70 font-semibold leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Connecting Arrow (Desktop: Right, Mobile: Hidden) */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full border border-black/10 bg-white text-black/60 shadow-2xs">
                    <ArrowRight size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Perks Section ───────────────────────────────────────────── */}
      <section id="perks" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black/70 uppercase tracking-wider mb-2">
            <Star className="w-3.5 h-3.5" /> Ambassador Benefits
          </div>
          <h2 className="text-3xl font-black text-black tracking-tight">
            Why become a Campus Ambassador?
          </h2>
          <p className="text-sm font-semibold text-black/70 mt-2">
            Build real leadership credentials while connecting your entire campus on Meova.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PERKS.map((p) => (
            <div 
              key={p.title} 
              className="bg-white border border-black/10 rounded-[28px] p-6 hover:border-black/30 transition-all hover:shadow-xs group"
            >
              <div className="w-10 h-10 rounded-2xl bg-black/5 text-black border border-black/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                {p.icon}
              </div>
              <h3 className="font-bold text-black text-base mb-1.5">{p.title}</h3>
              <p className="text-xs font-semibold text-black/70 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dark Feature Highlight Banner ───────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
        <div className="bg-black text-white rounded-[32px] p-8 md:p-10 border border-black/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Built exclusively for verified <span className="text-emerald-400">university students.</span>
              </h3>
              <p className="text-xs font-medium text-white/80 mt-1.5 max-w-xl leading-relaxed">
                Every member is authenticated via official college credentials. Ambassadors maintain integrity, coordinate trusted campus meetups, and foster a safe peer network.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 active:scale-95 font-bold px-6 py-3 text-xs flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-all cursor-pointer"
          >
            <span>Apply to Lead Campus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FAQs Section ────────────────────────────────────────────── */}
      <section id="faqs" className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-black tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm font-semibold text-black/70 mt-2">
            Got questions before applying? Here is everything you need to know.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="border border-black/10 rounded-[22px] p-6 bg-white shadow-2xs">
              <p className="font-bold text-black text-sm">{faq.q}</p>
              <p className="text-xs font-semibold text-black/70 mt-1.5 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Call To Action ───────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-white border border-[#E7E5E4] rounded-[32px] p-10 sm:p-14 text-center shadow-sm">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/60 bg-black/5 px-3.5 py-1 rounded-full inline-block">
              Priority Campus Selection
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1C1917] leading-tight">
              Ready to own your campus experience?
            </h2>
            <p className="text-black/70 text-sm font-medium max-w-md mx-auto">
              Applications are reviewed on a rolling basis. Take 2 minutes to apply today.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white font-bold px-8 py-3.5 rounded-full whitespace-nowrap flex-shrink-0 active:scale-95 transition-all shadow-sm shadow-[#7657D9]/12 text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Apply for Your Campus</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Standard Legal & Compliance Footer ──────────────────────── */}
      <LegalFooter />

      {/* ── Application Form Modal ──────────────────────────────────── */}
      {showForm && !submitted && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !submitting && setShowForm(false)}
        >
          <div 
            className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[90dvh] sm:max-h-[85vh] overflow-hidden shadow-2xl border border-black/10 flex flex-col transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#FAFAF8] px-6 sm:px-8 py-5 border-b border-[#E7E5E4] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black/5 border border-black/10 flex items-center justify-center text-[#1C1917] flex-shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-[#1C1917] leading-tight">Campus Ambassador Application</h2>
                  <p className="text-xs text-black/60 font-medium">Cohort 2026 • Official Student Leadership</p>
                </div>
              </div>

              {!submitting && (
                <button 
                  type="button"
                  onClick={() => setShowForm(false)} 
                  className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Scrollable Body */}
            <form noValidate onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 overflow-y-auto flex-1 font-inter text-black overscroll-contain pb-12 sm:pb-8">
              {/* Full Name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  <User className="w-3.5 h-3.5 text-black/70" /> Full Name *
                </label>
                <input
                  value={form.full_name}
                  maxLength={FIELD_LIMITS.full_name}
                  onChange={e => updateField('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all ${
                    fieldErrors.full_name
                      ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                      : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                  }`}
                />
                {fieldErrors.full_name && (
                  <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    <span>{fieldErrors.full_name}</span>
                  </p>
                )}
              </div>

              {/* College Selection */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-black/70" /> College / University *
                </label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Select your college...' },
                    ...collegeOptions,
                    { value: 'other', label: 'Other University (Not Listed)' }
                  ]}
                  value={form.college_id}
                  onChange={val => {
                    const selectedCollege = colleges.find(c => c.id === val);
                    setForm(f => ({ 
                      ...f, 
                      college_id: val,
                      college_name: val === 'other' ? '' : (selectedCollege?.name || '')
                    }));
                    if (fieldErrors.college_id) {
                      setFieldErrors(prev => { const n = { ...prev }; delete n.college_id; return n; });
                    }
                    if (error) setError('');
                  }}
                  placeholder="Select your college / university"
                  triggerClassName={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-sm font-semibold text-black flex items-center justify-between shadow-xs transition-all cursor-pointer outline-none ${
                    fieldErrors.college_id
                      ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                      : 'border-black/10 hover:border-black/30 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                  }`}
                />
                {fieldErrors.college_id && (
                  <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    <span>{fieldErrors.college_id}</span>
                  </p>
                )}

                {/* If "other" university selected, provide custom name input */}
                {form.college_id === 'other' && (
                  <div className="mt-2.5">
                    <input
                      value={form.college_name}
                      maxLength={FIELD_LIMITS.college_name}
                      onChange={e => updateField('college_name', e.target.value)}
                      placeholder="Enter your college / university full name *"
                      className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all ${
                        fieldErrors.college_name
                          ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                          : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                      }`}
                    />
                    {fieldErrors.college_name && (
                      <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={13} className="flex-shrink-0" />
                        <span>{fieldErrors.college_name}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-black/70" /> Email Address *
                </label>
                <input
                  type="email"
                  value={form.email}
                  maxLength={FIELD_LIMITS.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="your.email@university.edu"
                  className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all ${
                    fieldErrors.email
                      ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                      : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-black/70" /> WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  maxLength={FIELD_LIMITS.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all ${
                    fieldErrors.phone
                      ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                      : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    <span>{fieldErrors.phone}</span>
                  </p>
                )}
              </div>

              {/* Study Year & Branch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-black/70" /> Study Year
                  </label>
                  <input
                    value={form.year}
                    maxLength={FIELD_LIMITS.year}
                    onChange={e => updateField('year', e.target.value)}
                    placeholder="e.g. 2nd Year"
                    className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all ${
                      fieldErrors.year
                        ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                        : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                    }`}
                  />
                  {fieldErrors.year && (
                    <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={13} className="flex-shrink-0" />
                      <span>{fieldErrors.year}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-black/70" /> Course / Branch
                  </label>
                  <input
                    value={form.branch}
                    maxLength={FIELD_LIMITS.branch}
                    onChange={e => updateField('branch', e.target.value)}
                    placeholder="e.g. B.Tech CSE"
                    className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all ${
                      fieldErrors.branch
                        ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                        : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                    }`}
                  />
                  {fieldErrors.branch && (
                    <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={13} className="flex-shrink-0" />
                      <span>{fieldErrors.branch}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Instagram & LinkedIn */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                    <Instagram className="w-3.5 h-3.5 text-black/70" /> Instagram Handle
                  </label>
                  <input
                    value={form.instagram_handle}
                    maxLength={FIELD_LIMITS.instagram_handle}
                    onChange={e => updateField('instagram_handle', e.target.value)}
                    placeholder="@your_username"
                    className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all ${
                      fieldErrors.instagram_handle
                        ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                        : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                    }`}
                  />
                  {fieldErrors.instagram_handle && (
                    <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={13} className="flex-shrink-0" />
                      <span>{fieldErrors.instagram_handle}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-black/70" /> LinkedIn URL
                  </label>
                  <input
                    value={form.linkedin_url}
                    maxLength={FIELD_LIMITS.linkedin_url}
                    onChange={e => updateField('linkedin_url', e.target.value)}
                    placeholder="linkedin.com/in/..."
                    className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all ${
                      fieldErrors.linkedin_url
                        ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                        : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                    }`}
                  />
                  {fieldErrors.linkedin_url && (
                    <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={13} className="flex-shrink-0" />
                      <span>{fieldErrors.linkedin_url}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Why Ambassador (Max 150 Chars with Strict Cap) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-black/70" /> Why do you want to represent Meova? *
                  </label>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all ${
                    form.why_ambassador.length >= 150
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : form.why_ambassador.length >= 20
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-black/5 text-black/70'
                  }`}>
                    {form.why_ambassador.length} / 150 {form.why_ambassador.length >= 150 ? 'max' : 'chars'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={FIELD_LIMITS.why_ambassador}
                  value={form.why_ambassador}
                  onChange={e => updateField('why_ambassador', e.target.value)}
                  placeholder="Share a short note on your leadership experience or campus community involvement (max 150 characters)..."
                  className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all resize-none ${
                    fieldErrors.why_ambassador
                      ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                      : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                  }`}
                />
                {fieldErrors.why_ambassador && (
                  <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    <span>{fieldErrors.why_ambassador}</span>
                  </p>
                )}
              </div>

              {/* Campus Meeting Spots */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-black/70" /> Campus Meeting Spots (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={FIELD_LIMITS.meeting_locations}
                  value={form.meeting_locations}
                  onChange={e => updateField('meeting_locations', e.target.value)}
                  placeholder="e.g. Main Canteen, Central Library Lawn, Tech Block (one spot per line)"
                  className={`w-full bg-[#FAFAF8] border rounded-2xl px-4 py-3 text-base sm:text-sm font-semibold text-black placeholder:text-black/40 outline-none transition-all resize-none ${
                    fieldErrors.meeting_locations
                      ? 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10'
                      : 'border-black/10 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5'
                  }`}
                />
                {fieldErrors.meeting_locations && (
                  <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    <span>{fieldErrors.meeting_locations}</span>
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white font-bold text-sm shadow-sm shadow-[#7657D9]/12 active:scale-[0.98] transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Ambassador Application</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Success State Modal ─────────────────────────────────────── */}
      {submitted && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl border border-black/10">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider mb-3">
              Cohort 2026 • Review Pending
            </div>
            <h2 className="text-2xl font-black text-black tracking-tight mb-2">Application Received!</h2>
            <p className="text-black/70 text-xs font-semibold leading-relaxed mb-6">
              Our leadership desk will review your details and university recommendations within 48 hours. You will receive an email confirmation.
            </p>
            <button
              onClick={() => { setShowForm(false); setSubmitted(false); }}
              className="w-full py-3.5 rounded-full bg-black text-white text-xs font-bold hover:bg-black/90 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

