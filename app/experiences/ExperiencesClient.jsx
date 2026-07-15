'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, Calendar, MapPin, Star, X, CheckCircle, 
  Loader2, Search, ArrowUpDown, ShieldAlert, Clock, Compass,
  Coffee, BookOpen, Briefcase, Camera, Activity, Music, Sparkles
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';

import { getUserAvatarUrl, getCartoonAvatar } from '../../utils/avatar';

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

export default function ExperiencesClient({ currentUser, initialSparks }) {
  const router = useRouter();
  const [experiences, setExperiences] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeInstagramUser, setActiveInstagramUser] = useState(null);
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'price_asc' | 'price_desc' | 'newest'
  const [sortOpen, setSortOpen] = useState(false);
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [sparksBalance, setSparksBalance] = useState(initialSparks || 0);

  // Booking Modal State
  const [selectedExp, setSelectedExp] = useState(null);
  const [bookingDate, setBookingDate] = useState('Monday');
  const [bookingTime, setBookingTime] = useState('4:00 PM');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setExperiences(mockDb.getExperiences());
      if (currentUser) {
        const w = mockDb.getWallet(currentUser.id);
        setSparksBalance((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
      }
    }
  }, [currentUser]);

  const handleConfirmBooking = async () => {
    if (!selectedExp || !currentUser) return;
    if (sparksBalance < selectedExp.price) {
      alert('Insufficient Sparks! Please purchase more in your wallet.');
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
      guestName: currentUser.full_name || 'Guest',
      date: bookingDate,
      time: bookingTime
    });

    setBookingLoading(false);
    setBookingSuccess(true);
    
    // Refresh balance
    const w = mockDb.getWallet(currentUser.id);
    setSparksBalance((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
  };

  // Categories list — Lucide icons to match nav bar aesthetic
  const categoriesList = [
    { name: 'All',     value: 'All',         Icon: Compass,   accent: '#818cf8' },
    { name: 'Coffee',  value: 'Coffee',      Icon: Coffee,    accent: '#f59e0b' },
    { name: 'Study',   value: 'Study',       Icon: BookOpen,  accent: '#34d399' },
    { name: 'Startup', value: 'Startup',     Icon: Briefcase, accent: '#a78bfa' },
    { name: 'Photo',   value: 'Photography', Icon: Camera,    accent: '#f472b6' },
    { name: 'Sports',  value: 'Sports',      Icon: Activity,  accent: '#fb923c' },
    { name: 'Music',   value: 'Music',       Icon: Music,     accent: '#f87171' },
  ];

  // Filtering & Sorting
  const query = searchQuery.toLowerCase().trim();
  let filtered = experiences.filter(exp => {
    const host = mockDb.getUser(exp.hostId);
    const matchesSearch = 
      exp.title.toLowerCase().includes(query) ||
      exp.description.toLowerCase().includes(query) ||
      exp.location.toLowerCase().includes(query) ||
      (host?.full_name || '').toLowerCase().includes(query) ||
      exp.tags.some(t => t.toLowerCase().includes(query));

    const matchesCategory = selectedCategory === 'All' || exp.category.toLowerCase() === selectedCategory.toLowerCase();

    // Check if available today (Mock availability - assume Monday is "today")
    const matchesToday = !availableTodayOnly || exp.days.includes('Monday');

    return matchesSearch && matchesCategory && matchesToday;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'newest') return b.id.localeCompare(a.id); // Newer first based on ID
    return 0;
  });

  return (
    <div className="w-full max-w-[640px] mx-auto pb-24 px-4 space-y-8 anim-fade-in">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="pt-6 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Discover Experiences
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-widest">
            Join campus events hosted by verified students
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coffee connect, startup discussions, gaming..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[#6366f1]/40 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all font-semibold shadow-inner"
          />
        </div>
      </div>

      {/* ── CATEGORY QUICK CHIPS ───────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
        {categoriesList.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
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

      {/* ── ADVANCED FILTERS & SORTING BAR ────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-4 py-3.5 rounded-2xl">
        {/* Available Today Filter */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={availableTodayOnly}
            onChange={(e) => setAvailableTodayOnly(e.target.checked)}
            className="w-4 h-4 accent-[#6366f1] rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] focus:ring-0" 
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Available Today</span>
        </label>

        {/* Sorting dropdown */}
        <div className="relative">
          <button 
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] px-3.5 py-2 rounded-xl transition-all cursor-pointer select-none text-[9.5px] font-black uppercase tracking-wider text-[var(--text-secondary)]"
          >
            <ArrowUpDown size={11} className="text-[var(--text-muted)]" />
            <span>
              {sortBy === 'rating' && 'Highest Rated'}
              {sortBy === 'price_asc' && 'Lowest Price'}
              {sortBy === 'price_desc' && 'Highest Price'}
              {sortBy === 'newest' && 'Newest First'}
            </span>
          </button>

          {sortOpen && (
            <>
              {/* Invisible dismiss backdrop */}
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setSortOpen(false)} 
              />
              
              {/* Dropdown Menu popover */}
              <div className="absolute right-0 mt-2 w-44 z-40 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-1.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl anim-scale-in text-left">
                {[
                  { value: 'rating', label: 'Highest Rated' },
                  { value: 'price_asc', label: 'Lowest Price' },
                  { value: 'price_desc', label: 'Highest Price' },
                  { value: 'newest', label: 'Newest First' }
                ].map((opt) => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'bg-[var(--accent)] text-white' 
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── EXPERIENCES GRID (Consistent with EventCard & Premium tokens) ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2rem]">
          <Compass className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
          <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">No experiences found</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-semibold">Try modifying your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {filtered.map((exp) => {
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
      )}

      {/* ── BOOKING MODAL (PREMIUM GLASSMORPHIC) ─────────────────── */}
      {selectedExp && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(6, 7, 19, 0.85)', backdropFilter: 'blur(12px)' }}
          onClick={() => !bookingLoading && setSelectedExp(null)}
        >
          <div 
            className="relative w-full max-w-sm rounded-[2rem] p-6 anim-scale-in"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-popup)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            {!bookingLoading && !bookingSuccess && (
              <button 
                onClick={() => setSelectedExp(null)}
                className="absolute top-5 right-5 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]"
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
                    You have successfully requested <strong className="text-white">{selectedExp.title}</strong>. {selectedExp.price} Sparks have been locked in platform escrow. Check your notifications for confirmation status.
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedExp(null); setBookingSuccess(false); }}
                  className="w-full py-3.5 rounded-xl text-xs font-black text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Done
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
                    <span>Safety: Meet strictly in approved public campus locations. Never private locations.</span>
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
