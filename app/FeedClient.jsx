'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, MessageCircle, Heart, Share2, Calendar, MapPin, 
  Sparkles, Layers, BookOpen, UserCheck, MessageSquare, 
  Send, X, CheckCircle, Loader2, Star, Check, Search, 
  ShieldAlert, Clock, AlertTriangle, ShieldCheck, Compass, Users,
  Coffee, Briefcase, Camera, Activity, Music
} from 'lucide-react';
import { mockDb } from '../lib/mockDatabase';
import confetti from 'canvas-confetti';

import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';

// Pass the full user object for best resolution (photo > instagram > cartoon)
function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

function getRealInstagramHandle(username) {
  const normalized = (username || '').toLowerCase().replace('@', '').trim();
  const mapping = {
    priya_p: 'spotify',
    aarav_sharma: 'github',
    neha_v: 'figma',
    ananya_kapoor: 'nasa'
  };
  return mapping[normalized] || normalized;
}

export default function FeedClient({ currentUser, initialSparks, people = [] }) {
  const router = useRouter();
  // Database hydration
  const [dbHydrated, setDbHydrated] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [userData, setUserData] = useState(currentUser);
  const [sparksBalance, setSparksBalance] = useState(initialSparks || 0);
  const [popularHosts, setPopularHosts] = useState([]);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeInstagramUser, setActiveInstagramUser] = useState(null);

  // Interactive Code Entry
  const [verificationCodes, setVerificationCodes] = useState({});
  const [verificationError, setVerificationError] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);

  // Booking Modal State
  const [selectedExp, setSelectedExp] = useState(null);
  const [bookingDate, setBookingDate] = useState('Monday');
  const [bookingTime, setBookingTime] = useState('4:00 PM');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Review Dialog State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewCategories, setReviewCategories] = useState([]);

  // QR & Booking Details Modal
  const [selectedActiveBooking, setSelectedActiveBooking] = useState(null);
  const [isScanningMock, setIsScanningMock] = useState(false);

  // Load from local storage DB on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Fetch initial data
      setExperiences(mockDb.getExperiences());
      setBookings(mockDb.getBookings());
      setPopularHosts(mockDb.getUsers().filter(u => u.isHost));
      if (currentUser) {
        const u = mockDb.getUser(currentUser.id);
        if (u) setUserData(u);
        const w = mockDb.getWallet(currentUser.id);
        setSparksBalance((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
      }
      setDbHydrated(true);
    }
  }, [currentUser]);

  // Synchronise state with local storage updates
  const refreshDbState = () => {
    setExperiences(mockDb.getExperiences());
    setBookings(mockDb.getBookings());
    setPopularHosts(mockDb.getUsers().filter(u => u.isHost));
    if (currentUser) {
      const u = mockDb.getUser(currentUser.id);
      if (u) setUserData(u);
      const w = mockDb.getWallet(currentUser.id);
      setSparksBalance((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
    }
  };

  // Booking confirming action
  const handleConfirmBooking = async () => {
    if (!selectedExp || !currentUser) return;
    if (sparksBalance < selectedExp.price) {
      alert('Insufficient Sparks! Please buy sparks in your wallet first.');
      setSelectedExp(null);
      return;
    }

    setBookingLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    
    mockDb.createBooking({
      experienceId: selectedExp.id,
      title: selectedExp.title,
      price: selectedExp.price,
      duration: selectedExp.duration,
      location: selectedExp.location,
      category: selectedExp.category,
      hostId: selectedExp.hostId,
      hostName: mockDb.getUser(selectedExp.hostId)?.full_name || 'Host',
      guestId: currentUser.id,
      guestName: userData?.full_name || 'Guest',
      date: bookingDate,
      time: bookingTime
    });

    setBookingLoading(false);
    setBookingSuccess(true);
    refreshDbState();
  };

  // Host Action: Accept Request
  const handleAcceptRequest = (bookingId) => {
    mockDb.updateBookingStatus(bookingId, 'Confirmed');
    refreshDbState();
  };

  // Host Action: Decline Request
  const handleDeclineRequest = (bookingId) => {
    mockDb.updateBookingStatus(bookingId, 'Rejected');
    refreshDbState();
  };

  // Host Action: Code validation & Completion
  const handleVerifyCode = async (bookingId) => {
    const code = verificationCodes[bookingId];
    if (!code || code.length !== 6) {
      setVerificationError(prev => ({ ...prev, [bookingId]: 'Enter a valid 6-digit code' }));
      return;
    }

    setVerifyingId(bookingId);
    setVerificationError(prev => ({ ...prev, [bookingId]: '' }));
    await new Promise(r => setTimeout(r, 1000));

    const res = mockDb.completeMeeting(bookingId, code);
    setVerifyingId(null);

    if (res.success) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      refreshDbState();
      // Open review dialog immediately for the host to review the guest
      setReviewBooking(res.booking);
    } else {
      setVerificationError(prev => ({ ...prev, [bookingId]: res.error }));
    }
  };

  // Guest Action: Complete Review
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewBooking) return;

    // Check who is writing the review
    const isHost = currentUser.id === reviewBooking.hostId;
    const targetUserId = isHost ? reviewBooking.guestId : reviewBooking.hostId;

    mockDb.addReview({
      experienceId: reviewBooking.experienceId,
      hostId: targetUserId,
      authorName: userData?.full_name || 'Student',
      authorAvatar: userData?.full_name || 'Student',
      rating: reviewRating,
      written: reviewText,
      categories: reviewCategories
    });

    // Mark booking as Closed if review completed
    const bookingsList = mockDb.getBookings();
    const bIdx = bookingsList.findIndex(b => b.id === reviewBooking.id);
    if (bIdx !== -1) {
      bookingsList[bIdx].status = 'Booking Closed';
      mockDb.updateBookingStatus(reviewBooking.id, 'Booking Closed');
    }

    setReviewBooking(null);
    setReviewText('');
    setReviewCategories([]);
    refreshDbState();
    alert('Thank you for the review!');
  };

  const toggleReviewCategory = (cat) => {
    if (reviewCategories.includes(cat)) {
      setReviewCategories(reviewCategories.filter(c => c !== cat));
    } else {
      setReviewCategories([...reviewCategories, cat]);
    }
  };

  // Filter & Search queries
  const query = searchQuery.toLowerCase().trim();
  const filteredExperiences = experiences.filter(exp => {
    const host = mockDb.getUser(exp.hostId);
    const matchesSearch = 
      exp.title.toLowerCase().includes(query) ||
      exp.description.toLowerCase().includes(query) ||
      exp.category.toLowerCase().includes(query) ||
      exp.location.toLowerCase().includes(query) ||
      (host?.full_name || '').toLowerCase().includes(query) ||
      exp.tags.some(t => t.toLowerCase().includes(query));

    const matchesCategory = activeCategory === 'All' || exp.category.toLowerCase() === activeCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Extract popular hosts is now managed as state to prevent SSR hydration mismatches

  // Active bookings involving the current user
  const activeUserBookings = bookings.filter(b => 
    (b.guestId === currentUser?.id || b.hostId === currentUser?.id) && 
    ['Requested', 'Confirmed', 'Meeting Completed'].includes(b.status)
  );

  return (
    <div className="space-y-8">
      
      {/* ── UPCOMING TODAY (Horizontal Carousel) ────────────────────── */}
      {currentUser && activeUserBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Upcoming Today</h3>
            </div>
            <span className="text-[9px] text-[#818cf8] font-bold uppercase tracking-widest">
              {activeUserBookings.length} Active
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 snap-x snap-mandatory">
            {activeUserBookings.map((b) => {
              const isHost = b.hostId === currentUser.id;
              const targetName = isHost ? b.guestName : b.hostName;
              return (
                <div 
                  key={b.id}
                  onClick={() => setSelectedActiveBooking(b)}
                  className="flex-shrink-0 w-[290px] md:w-[320px] snap-start bg-gradient-to-br from-[#1b1c31] to-[#0d0e17] border border-[#6366f1]/20 hover:border-[#6366f1]/40 rounded-[2rem] p-4.5 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-lg hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
                        <img src={avatarUrl(targetName)} alt={targetName} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border inline-block mb-1.5 ${
                          b.status === 'Requested' 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                            : b.status === 'Confirmed'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 animate-pulse'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                        }`}>
                          {b.status}
                        </span>
                        <h4 className="text-[12px] font-black text-white uppercase truncate max-w-[160px]">{b.title}</h4>
                        <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-0.5 uppercase tracking-wider">
                          {isHost ? `Guest: ${b.guestName}` : `Host: ${b.hostName}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                    <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-wider space-y-0.5">
                      <p className="text-white font-bold">{b.date} · {b.time}</p>
                      <p className="line-clamp-1 max-w-[140px]">Loc: {b.location}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActiveBooking(b);
                      }}
                      className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[9.5px] font-black uppercase px-3.5 py-2 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md flex items-center gap-1"
                    >
                      <span>{b.status === 'Confirmed' ? 'Verify QR' : 'Details'}</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── HIGHLIGHTED SEARCH MODULE ───────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search campus experiences, hosts, tags, or public locations..."
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[#6366f1]/40 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all font-semibold shadow-inner"
        />
      </div>

      {/* ── CATEGORY QUICK CHIPS ──────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
        {[
          { name: 'All',      value: 'All',         Icon: Compass,  accent: '#818cf8' },
          { name: 'Coffee',   value: 'Coffee',      Icon: Coffee,   accent: '#f59e0b' },
          { name: 'Study',    value: 'Study',       Icon: BookOpen, accent: '#34d399' },
          { name: 'Startup',  value: 'Startup',     Icon: Briefcase,accent: '#a78bfa' },
          { name: 'Photo',    value: 'Photography', Icon: Camera,   accent: '#f472b6' },
          { name: 'Sports',   value: 'Sports',      Icon: Activity, accent: '#fb923c' },
          { name: 'Music',    value: 'Music',       Icon: Music,    accent: '#f87171' },
        ].map((cat) => {
          const isSelected = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all duration-200 flex-shrink-0 cursor-pointer text-[10px] font-bold uppercase tracking-wider ${
                isSelected
                  ? 'text-white border-transparent'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-mid)]'
              }`}
              style={isSelected ? { background: cat.accent, boxShadow: `0 2px 12px ${cat.accent}50` } : {}}
            >
              <cat.Icon size={13} strokeWidth={isSelected ? 2.5 : 1.75} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── TRENDING EXPERIENCES SECTION ───────────────────────────── */}
      {filteredExperiences.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Trending Experiences</h3>
              <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-0.5">Top-rated sessions booked by students recently</p>
            </div>
            <Link href="/experiences" className="text-[10px] font-black text-[#818cf8] hover:text-white uppercase tracking-wider flex items-center gap-0.5">
              <span>View All</span>
              <Compass size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {filteredExperiences.slice(0, 4).map((exp) => {
              const host = mockDb.getUser(exp.hostId);
              return (
                <div 
                  key={exp.id} 
                  onClick={() => router.push(`/experiences/${exp.id}`)}
                  className="group relative flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[1.5rem] p-3.5 hover:bg-[var(--bg-hover)] transition-all duration-300 overflow-hidden cursor-pointer h-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(99,102,241,0.12)] hover:border-[#6366f1]/30"
                >
                  {/* Host DP & Badges Header */}
                  <div className="flex items-center justify-between gap-2.5 mb-2.5">
                    {/* Host DP */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/users/${host?.id || exp.hostId}`);
                      }}
                      className="w-8 h-8 rounded-full p-[1.2px] bg-gradient-to-tr from-[#6366f1]/40 to-[#ec4899]/40 hover:from-[#6366f1] hover:to-[#ec4899] transition-all shadow-sm flex-shrink-0"
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-surface)] border border-neutral-900">
                        <img src={avatarUrl(host?.full_name)} alt={host?.full_name} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    {/* Right Badges (Instagram & Rating) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {host?.instagram && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveInstagramUser(host.instagram);
                          }}
                          className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                          title={`Instagram: @${host.instagram}`}
                        >
                          <span className="text-[10px] leading-none select-none">📸</span>
                        </button>
                      )}
                      <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] px-1.5 py-0.5 rounded-lg text-[8px] font-black text-yellow-400 flex items-center gap-0.5 shadow-sm">
                        <Star size={8} className="fill-current text-yellow-400" />
                        <span>{exp.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col flex-1 justify-between text-left">
                    <div className="space-y-0.5">
                      {/* Host Subtitle */}
                      <p className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-wider truncate">
                        {host?.full_name} · {host?.year} Yr
                      </p>

                      {/* Category Badge */}
                      <span className="inline-block text-[7.5px] font-black uppercase tracking-widest text-[#818cf8]">
                        {exp.category}
                      </span>

                      {/* Title */}
                      <h4 className="text-[11px] font-black text-[var(--text-primary)] leading-tight mt-0.5 line-clamp-1 group-hover:text-[#818cf8] transition-colors">
                        {exp.title}
                      </h4>
                      
                      {/* Description */}
                      <p className="text-[9.5px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 pt-0.5">
                        {exp.description}
                      </p>

                      {/* Location & Duration Info on a single line */}
                      <div className="flex items-center gap-1.5 text-[8.5px] font-semibold text-[var(--text-secondary)] pt-2 min-w-0">
                        <div className="flex items-center gap-0.5 min-w-0">
                          <MapPin size={8} className="text-[var(--text-muted)] flex-shrink-0" />
                          <span className="truncate">{exp.location.split(',')[0]}</span>
                        </div>
                        <span className="text-neutral-500 flex-shrink-0">·</span>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Clock size={8} className="text-[var(--text-muted)]" />
                          <span>{exp.duration}m</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer price & book button */}
                    <div className="border-t border-[var(--border-subtle)] pt-2.5 mt-3 flex items-center justify-between gap-1">
                      <div className="flex flex-col text-left">
                        <span className="text-[6.5px] text-[var(--text-muted)] font-black uppercase tracking-widest">Price</span>
                        <span className="text-[10px] font-black text-yellow-400 flex items-center gap-0.5">
                          <Zap size={9} className="fill-current text-yellow-400" />
                          <span>{exp.price}</span>
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!currentUser) return alert('Please login first');
                          setSelectedExp(exp);
                          setBookingSuccess(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider bg-gradient-to-r from-[#6366f1] to-[#ec4899] text-white hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TOP HOSTS (Campus Creators Carousel) ───────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Top Hosts</h3>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-0.5">Top-rated campus student creators</p>
          </div>
        </div>

        <div className="flex gap-5 overflow-x-auto no-scrollbar py-2">
          {popularHosts.map((host) => (
            <button
              key={host.id}
              onClick={() => {
                if (host.instagram) {
                  setActiveInstagramUser(host.instagram);
                } else {
                  setSearchQuery(host.full_name);
                }
              }}
              className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer"
              style={{ width: '80px' }}
            >
              <div className="relative w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-[#6366f1] via-[#a855f7] to-[#ec4899] transition-transform duration-300 group-hover:scale-105 shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-surface)] border border-neutral-900">
                  <img src={avatarUrl(host.full_name)} alt={host.full_name} className="w-full h-full object-cover" />
                </div>
                {host.instagram && (
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] border border-neutral-950 flex items-center justify-center text-[9px] shadow-md select-none">
                    📸
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-[var(--text-primary)] truncate max-w-[75px] group-hover:text-[#818cf8] transition-colors">
                  {host.full_name.split(' ')[0]}
                </p>
                <span className="text-[8px] font-black text-yellow-400 flex items-center justify-center gap-0.5">
                  <Star size={7} className="fill-current" />
                  {host.rating}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>


      {/* ── COMMUNITIES HOSTING EVENTS ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Communities Hosting Events</h3>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-0.5">Official clubs organizing campus-approved meetups</p>
          </div>
        </div>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden divide-y divide-[var(--border-subtle)] shadow-lg">
          {[
            { name: 'Google Developer Student Club', category: 'Tech & Coding', count: 180, logo: 'GD' },
            { name: 'Campus Symphony Club', category: 'Music & Art', count: 96, logo: 'CS' },
            { name: 'Gladiators FC (Sports)', category: 'Athletics & Gym', count: 140, logo: 'GF' }
          ].map((club) => (
            <div key={club.name} className="flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/25 flex items-center justify-center text-xs font-black text-[#818cf8]">
                  {club.logo}
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-primary)]">{club.name}</h4>
                  <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5">
                    {club.category} • {club.count} Members
                  </p>
                </div>
              </div>
              
              <Link href="/circles" className="bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:bg-[#6366f1]/10 text-xs font-black uppercase px-4.5 py-2 rounded-xl transition-all cursor-pointer">
                Join Circle
              </Link>
            </div>
          ))}
        </div>
      </div>


      {/* ── BOOKING MODAL (PREMIUM AIRBNB STYLE) ───────────────────── */}
      {selectedExp && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => !bookingLoading && setSelectedExp(null)}
        >
          <div 
            className="relative w-full max-w-sm rounded-3xl p-6 anim-scale-in"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            {!bookingLoading && !bookingSuccess && (
              <button 
                onClick={() => setSelectedExp(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]"
              >
                <X size={15} />
              </button>
            )}

            {bookingSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--text-primary)]">Booking Requested!</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2 font-semibold">
                    You have successfully requested <strong className="text-white">{selectedExp.title}</strong>. {selectedExp.price} Sparks have been locked in platform escrow. Check the **Active Experience Hub** at the top of the homepage for updates!
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedExp(null); setBookingSuccess(false); }}
                  className="w-full py-3.5 rounded-xl text-xs font-black text-white bg-[#6366f1] hover:bg-[#4f46e5] transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Got it
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5 border-b border-[var(--border-subtle)] pb-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
                    <img src={avatarUrl(mockDb.getUser(selectedExp.hostId)?.full_name)} alt="host" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Book Experience</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5">Host: {mockDb.getUser(selectedExp.hostId)?.full_name}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Select Slots */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Available Day</label>
                      <select 
                        value={bookingDate} 
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none cursor-pointer"
                      >
                        {selectedExp.days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Time Slot</label>
                      <select 
                        value={bookingTime} 
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none cursor-pointer"
                      >
                        {selectedExp.slots.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="rounded-2xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 text-left">
                    {[
                      { label: 'Activity', value: selectedExp.title },
                      { label: 'Public Location', value: selectedExp.location },
                      { label: 'Duration', value: `${selectedExp.duration} Mins` },
                      { label: 'Cancellation Policy', value: 'Refundable until host accepts' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-3">
                        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider flex-shrink-0">{label}</span>
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] text-right leading-tight">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Safety Alert Banner */}
                  <div className="bg-amber-500/5 border border-amber-500/10 text-amber-500 p-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wide leading-relaxed flex items-start gap-1.5">
                    <ShieldAlert size={12} className="flex-shrink-0 mt-0.5" />
                    <span>Safety Reminder: Meet strictly in the approved public location. Never encourage private meetings.</span>
                  </div>

                  {/* Balance vs Price */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs font-bold">
                    <span className="text-[var(--text-muted)]">Cost: {selectedExp.price} ⚡</span>
                    <span className="text-[var(--text-primary)] flex items-center gap-1">
                      <span>Balance: {sparksBalance}</span>
                      <Zap size={11} className="text-[#fb923c] fill-current" />
                    </span>
                  </div>
                </div>

                {/* Confirm Book CTA */}
                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-md"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Requesting Booking...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Spend {selectedExp.price} Sparks &amp; Book</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REVIEW DIALOG DIALOG MODAL (POST MEETING) ───────────────── */}
      {reviewBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <form 
            onSubmit={handleSubmitReview}
            className="relative w-full max-w-sm rounded-3xl p-6 space-y-4 anim-scale-in"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
          >
            <div className="text-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Leave a Review</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-wider">
                How was your experience meeting with {currentUser.id === reviewBooking.hostId ? reviewBooking.guestName : reviewBooking.hostName}?
              </p>
            </div>

            {/* Stars selection */}
            <div className="flex justify-center gap-1.5 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="text-2xl transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                >
                  <Star 
                    size={28} 
                    className={star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'} 
                  />
                </button>
              ))}
            </div>

            {/* Category Checks */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-wider block">Endorse Qualities</label>
              <div className="flex flex-wrap gap-1.5">
                {['Friendly', 'Punctual', 'Respectful', 'Interesting Conversation', 'Would Meet Again'].map((cat) => {
                  const selected = reviewCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleReviewCategory(cat)}
                      className={`text-[9px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        selected 
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white font-bold' 
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written testimonial */}
            <div className="space-y-1">
              <label className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-wider block">Written Review</label>
              <textarea
                placeholder="Share details of your meetup (keep public, no numbers)..."
                required
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs font-semibold p-3 outline-none text-[var(--text-primary)] min-h-[70px] focus:border-[#6366f1]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase py-3 rounded-xl transition-all cursor-pointer shadow-md text-center"
            >
              Submit Review
            </button>
          </form>
        </div>
      )}

      {/* ── ACTIVE BOOKING DETAILS & MEETUP QR VERIFICATION MODAL ───── */}
      {selectedActiveBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => !isScanningMock && setSelectedActiveBooking(null)}
        >
          <div 
            className="relative w-full max-w-sm rounded-[2rem] p-6 space-y-5 anim-scale-in text-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            {!isScanningMock && (
              <button 
                onClick={() => setSelectedActiveBooking(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white transition-colors bg-[var(--bg-surface)]"
              >
                <X size={15} />
              </button>
            )}

            {/* Title / Status */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
                {selectedActiveBooking.status === 'Confirmed' ? 'Meetup Verification' : 'Booking Details'}
              </h3>
              <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-wider">
                Status: <span className="text-[#818cf8]">{selectedActiveBooking.status}</span>
              </p>
            </div>

            {/* QR Scanner Mock / Host Scan Screen */}
            {selectedActiveBooking.status === 'Confirmed' ? (
              <div className="space-y-4">
                {/* QR Display frame */}
                <div className="relative w-44 h-44 mx-auto bg-white rounded-2xl p-4 flex items-center justify-center shadow-inner overflow-hidden border border-[var(--border-subtle)]">
                  {/* Scanner moving green line overlay if scanning */}
                  {isScanningMock && (
                    <div className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-[bounce_1.5s_infinite]" />
                  )}
                  {/* Simulated QR Code blocks */}
                  <div className="grid grid-cols-5 gap-1 w-32 h-32 opacity-90">
                    {[...Array(25)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-full h-full rounded-sm ${
                          (i % 5 === 0 || i < 5 || i > 20 || i % 6 === 0) ? 'bg-black' : 'bg-transparent'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* 6-digit Code */}
                <div>
                  <p className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-wider">Meeting Code (Share at meetup)</p>
                  <p className="text-2xl font-black text-white tracking-widest mt-1 bg-[var(--bg-surface)] py-2.5 rounded-xl border border-[var(--border-subtle)] inline-block px-6">
                    {selectedActiveBooking.meetingCode}
                  </p>
                </div>

                {/* Verification Actions */}
                {selectedActiveBooking.hostId === currentUser.id ? (
                  // Host Side Options
                  <div className="space-y-3 pt-1 border-t border-[var(--border-subtle)] text-left">
                    <p className="text-[8.5px] text-[var(--text-muted)] font-black uppercase text-center">Host Controls</p>
                    
                    {/* Simulated Instant Scan Button */}
                    <button
                      type="button"
                      disabled={isScanningMock}
                      onClick={async () => {
                        setIsScanningMock(true);
                        await new Promise(r => setTimeout(r, 1500));
                        setIsScanningMock(false);
                        
                        // Execute check inline
                        const res = mockDb.completeMeeting(selectedActiveBooking.id, selectedActiveBooking.meetingCode);
                        if (res.success) {
                          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                          refreshDbState();
                          setSelectedActiveBooking(null);
                          setReviewBooking(res.booking);
                          alert('Meeting Verified Successfully via Scan! Payout released.');
                        } else {
                          alert(res.error || 'Scan failed.');
                        }
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      {isScanningMock ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Scanning Guest QR...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          <span>Instant Scan Guest QR</span>
                        </>
                      )}
                    </button>

                    {/* Numeric Entry option */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-wider block">Or Enter 6-digit Code Manually</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          maxLength={6}
                          placeholder="Code"
                          value={verificationCodes[selectedActiveBooking.id] || ''}
                          onChange={(e) => setVerificationCodes(prev => ({ ...prev, [selectedActiveBooking.id]: e.target.value }))}
                          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-black tracking-widest text-center text-[var(--text-primary)] w-28 outline-none focus:border-[#6366f1]"
                        />
                        <button
                          onClick={async () => {
                            const code = verificationCodes[selectedActiveBooking.id];
                            if (!code || code.length !== 6) {
                              alert('Enter a valid 6-digit code');
                              return;
                            }
                            setIsScanningMock(true);
                            await new Promise(r => setTimeout(r, 800));
                            setIsScanningMock(false);
                            const res = mockDb.completeMeeting(selectedActiveBooking.id, code);
                            if (res.success) {
                              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                              refreshDbState();
                              setSelectedActiveBooking(null);
                              setReviewBooking(res.booking);
                              alert('Verified successfully! Payout released.');
                            } else {
                              alert(res.error || 'Verification failed.');
                            }
                          }}
                          className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Guest Side View
                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-left space-y-1">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                      <ShieldAlert size={12} />
                      <span>Guest Instructions</span>
                    </p>
                    <p className="text-[9.5px] font-semibold text-[var(--text-secondary)] leading-relaxed">
                      Show this screen to your host <strong className="text-white">{selectedActiveBooking.hostName}</strong> at meetup location. They will scan the QR or enter the code to confirm meeting.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Requested or Other statuses details view
              <div className="space-y-4 text-left">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl space-y-3">
                  {[
                    { label: 'Activity', value: selectedActiveBooking.title },
                    { label: 'Host/Guest', value: selectedActiveBooking.hostId === currentUser.id ? selectedActiveBooking.guestName : selectedActiveBooking.hostName },
                    { label: 'Meeting Date', value: selectedActiveBooking.date },
                    { label: 'Meeting Time', value: selectedActiveBooking.time },
                    { label: 'Location', value: selectedActiveBooking.location },
                    { label: 'Duration', value: `${selectedActiveBooking.duration} Mins` },
                    { label: 'Escrow Spark Value', value: `${selectedActiveBooking.price} Sparks (Locked)` }
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-3 text-[10px]">
                      <span className="text-[8.5px] font-black text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
                      <span className="font-semibold text-[var(--text-secondary)]">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-[9px] font-bold uppercase tracking-wide leading-relaxed text-amber-500 text-center">
                  {selectedActiveBooking.status === 'Requested' 
                    ? 'Wait for the host to accept. Sparks are held safely in escrow.'
                    : 'Meeting completed! Payout has been released to host.'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INSTAGRAM VIEW MODAL (IFRAME) ─────────────────────────── */}
      {activeInstagramUser && (() => {
        const realHandle = getRealInstagramHandle(activeInstagramUser);
        return (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(6, 7, 19, 0.85)', backdropFilter: 'blur(16px)' }}
            onClick={() => setActiveInstagramUser(null)}
          >
            <div 
              className="relative w-full max-w-lg h-[80vh] rounded-[2.5rem] p-5 flex flex-col anim-scale-in"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-popup)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)] mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">📸</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Instagram Vibe</h4>
                    <p className="text-[9px] text-pink-400 font-bold uppercase mt-0.5">@{activeInstagramUser}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a 
                    href={`https://www.instagram.com/${realHandle}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Open ↗
                  </a>
                  <button 
                    onClick={() => setActiveInstagramUser(null)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Iframe Container */}
              <div className="flex-1 w-full rounded-2xl overflow-hidden bg-neutral-950 border border-[var(--border-subtle)] relative">
                <iframe 
                  src={`https://www.instagram.com/${realHandle}/embed/`}
                  className="w-full h-full border-0"
                  allowFullScreen
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title="Instagram Profile View"
                />
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
