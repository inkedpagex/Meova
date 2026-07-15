'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, Calendar, MapPin, Star, X, CheckCircle, 
  Loader2, ChevronLeft, ShieldAlert, Clock, Flag, ShieldClose, AlertOctagon, Heart
} from 'lucide-react';
import { mockDb } from '../../../lib/mockDatabase';

import { getUserAvatarUrl, getCartoonAvatar } from '../../../utils/avatar';

function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

export default function ExperienceDetailClient({ experienceId, currentUser, initialSparks }) {
  const router = useRouter();
  const [exp, setExp] = useState(null);
  const [host, setHost] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sparksBalance, setSparksBalance] = useState(initialSparks || 0);

  // Booking Flow
  const [bookingDate, setBookingDate] = useState('Monday');
  const [bookingTime, setBookingTime] = useState('4:00 PM');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [agreedSafety, setAgreedSafety] = useState(false);

  // Safety actions
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const found = mockDb.getExperience(experienceId);
      if (found) {
        setExp(found);
        setHost(mockDb.getUser(found.hostId));
        setReviews(mockDb.getReviews(found.hostId));
      }
      if (currentUser) {
        const w = mockDb.getWallet(currentUser.id);
        setSparksBalance((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
      }
    }
  }, [experienceId, currentUser]);

  const handleBook = () => {
    if (!currentUser) {
      alert('Please log in to book experiences.');
      router.push(`/login?next=/experiences/${experienceId}`);
      return;
    }
    setShowModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!agreedSafety) {
      alert('Please read and agree to the campus safety reminder before booking.');
      return;
    }
    if (sparksBalance < exp.price) {
      alert('Insufficient Sparks! Please purchase sparks in your wallet first.');
      setShowModal(false);
      return;
    }

    setBookingLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    mockDb.createBooking({
      experienceId: exp.id,
      title: exp.title,
      price: exp.price,
      duration: exp.duration,
      location: exp.location,
      category: exp.category,
      hostId: exp.hostId,
      hostName: host?.full_name || 'Host',
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

  const handleReport = () => {
    if (!currentUser) return alert('Login required to report users.');
    const reason = prompt('Please enter the reason for reporting this host:');
    if (reason) {
      mockDb.reportUser(host.id, currentUser.id, reason);
      setReported(true);
      alert('Report submitted successfully. Our campus moderation team will review this shortly.');
    }
  };

  if (!exp) {
    return (
      <div className="text-center py-24">
        <Loader2 className="animate-spin w-8 h-8 text-[var(--text-muted)] mx-auto mb-4" />
        <p className="text-xs font-black uppercase text-[var(--text-secondary)]">Loading Experience Details...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[680px] mx-auto pb-24 px-4 space-y-6 anim-fade-in relative">
      
      {/* ── BACK BUTTON ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link href="/experiences" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] hover:text-white transition-colors">
          <ChevronLeft size={14} />
          <span>Back to Discovery</span>
        </Link>
        <button 
          onClick={handleReport}
          disabled={reported}
          className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
            reported ? 'text-amber-500 cursor-default' : 'text-rose-500 hover:text-rose-400 cursor-pointer'
          }`}
        >
          <Flag size={12} />
          <span>{reported ? 'Reported' : 'Report Host'}</span>
        </button>
      </div>

      {/* ── HERO (Host-photo based, no stock images) ──────────────── */}
      <div className="h-56 md:h-64 rounded-3xl overflow-hidden border border-[var(--border-subtle)] relative flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0f0e17 0%, #1a1830 50%, #0d1117 100%)' }}>

        {/* Blurred host photo as ambient background */}
        {host && (
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${avatarUrl(host.full_name)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(24px) saturate(1.5)',
              transform: 'scale(1.1)'
            }}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />

        {/* Host avatar centered */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
            <img src={host ? avatarUrl(host.full_name) : ''} alt={host?.full_name} className="w-full h-full object-cover" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{host?.full_name}</p>
        </div>

        {/* Rating badge */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-yellow-400 border border-yellow-400/25 flex items-center gap-1">
          <Star size={11} className="fill-current" />
          <span>{exp.rating} · {exp.reviewsCount} completed meetups</span>
        </div>

        {/* Category chip */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-0.5 rounded text-[9px] font-black uppercase text-white tracking-widest border border-white/10">
          {exp.category}
        </div>
      </div>

      {/* ── TITLE & MAIN STATS ─────────────────────────────────────── */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 md:p-6 space-y-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            {exp.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mt-2">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-[#6366f1]" />
              <span className="text-white">{exp.location}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-[#6366f1]" />
              <span>{exp.duration} Mins duration</span>
            </span>
          </div>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
          {exp.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {exp.tags.map((t) => (
            <span key={t} className="text-[9px] font-black uppercase tracking-wider bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-3 py-1 rounded-md">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── HOST DETAILS CARD (AIRBNB STYLE) ────────────────────────── */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 md:p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-2">
          Your Host
        </h3>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
            <img src={avatarUrl(host?.full_name)} alt={host?.full_name} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-[var(--text-primary)] truncate">{host?.full_name}</h4>
              <div className="flex flex-wrap gap-1">
                {host?.badges?.map((badge) => (
                  <span key={badge} className="text-[7.5px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-[#818cf8] px-1.5 py-0.5 rounded">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
              {host?.year} Yr Student · {host?.branch} Branch
            </p>
            
            <p className="text-[10px] text-[var(--text-secondary)] leading-normal font-semibold italic">
              "{host?.bio}"
            </p>
          </div>
        </div>

        {/* Host metrics grids */}
        <div className="grid grid-cols-3 gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 rounded-2xl text-center">
          <div>
            <span className="text-[7.5px] text-[var(--text-muted)] font-black uppercase tracking-wider block">Rating</span>
            <span className="text-xs font-black text-white flex items-center justify-center gap-0.5 mt-1">
              <Star size={11} className="text-yellow-400 fill-current" />
              {host?.rating}
            </span>
          </div>
          <div>
            <span className="text-[7.5px] text-[var(--text-muted)] font-black uppercase tracking-wider block">Acceptance</span>
            <span className="text-xs font-black text-white mt-1 block">{host?.acceptanceRate || '100%'}</span>
          </div>
          <div>
            <span className="text-[7.5px] text-[var(--text-muted)] font-black uppercase tracking-wider block">Responsiveness</span>
            <span className="text-[8.5px] font-black text-emerald-400 mt-1 block truncate px-1">{host?.responseTime}</span>
          </div>
        </div>
      </div>

      {/* ── REVIEWS SECTION ────────────────────────────────────────── */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 md:p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
          <span>Student Reviews</span>
          <span className="text-[10px] text-[var(--text-muted)]">{reviews.length} reviews</span>
        </h3>

        {reviews.length === 0 ? (
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase text-center py-4">No reviews yet for this host</p>
        ) : (
          <div className="space-y-4 divide-y divide-[var(--border-subtle)]">
            {reviews.map((rev, idx) => (
              <div key={rev.id || idx} className={`space-y-2 ${idx > 0 ? 'pt-4' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <img src={avatarUrl(rev.authorName)} alt="avatar" />
                    </div>
                    <span className="text-[10px] font-black text-[var(--text-primary)] uppercase">{rev.authorName}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={10} className="fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-semibold italic">
                  "{rev.written}"
                </p>

                <div className="flex flex-wrap gap-1">
                  {rev.categories.map((c) => (
                    <span key={c} className="text-[7.5px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-[#34d399] px-1.5 py-0.5 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FLOATING STICKY BOOKING ACTION BAR ─────────────────────── */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-elevated)]/90 backdrop-blur-md border-t border-[var(--border-subtle)] py-4 px-5 flex items-center justify-between gap-4 max-w-[680px] mx-auto rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.3)]"
      >
        <div>
          <p className="text-[7.5px] text-[var(--text-muted)] font-black uppercase tracking-widest">Experience price</p>
          <p className="text-sm font-black text-yellow-400 flex items-center gap-0.5 mt-0.5">
            <Zap size={13} className="fill-current" />
            <span>{exp.price} Sparks</span>
          </p>
        </div>

        <button
          onClick={handleBook}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer active:scale-95 shadow-md"
        >
          Book Experience
        </button>
      </div>


      {/* ── BOOKING DIALOG MODAL ────────────────────────────────────── */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => !bookingLoading && setShowModal(false)}
        >
          <div 
            className="relative w-full max-w-sm rounded-3xl p-6 anim-scale-in"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {!bookingLoading && !bookingSuccess && (
              <button 
                onClick={() => setShowModal(false)}
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
                    You have successfully requested <strong className="text-white">{exp.title}</strong>. {exp.price} Sparks have been locked in platform escrow. Check your notifications for confirmation status.
                  </p>
                </div>
                <button
                  onClick={() => { setShowModal(false); setBookingSuccess(false); }}
                  className="w-full py-3.5 rounded-xl text-xs font-black text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5 border-b border-[var(--border-subtle)] pb-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
                    <img src={avatarUrl(host?.full_name)} alt="host" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Book Experience</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5">Host: {host?.full_name}</p>
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
                        {exp.days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Time Slot</label>
                      <select 
                        value={bookingTime} 
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none cursor-pointer"
                      >
                        {exp.slots.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="rounded-2xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 text-left">
                    {[
                      { label: 'Activity', value: exp.title },
                      { label: 'Public Location', value: exp.location },
                      { label: 'Duration', value: `${exp.duration} Mins` },
                      { label: 'Escrow Billing', value: 'Sparks held until meeting verified' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-3">
                        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider flex-shrink-0">{label}</span>
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] text-right leading-tight">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Safety advisory checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                    <input 
                      type="checkbox"
                      checked={agreedSafety}
                      onChange={(e) => setAgreedSafety(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[#6366f1] focus:ring-0 mt-0.5 cursor-pointer"
                    />
                    <div className="text-[9.5px] font-bold uppercase tracking-wide leading-relaxed text-amber-500">
                      I agree to meet only in public university locations (e.g. {exp.location}). No private meetups.
                    </div>
                  </label>

                  {/* Balance vs Price */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs font-bold">
                    <span className="text-[var(--text-muted)]">Cost: {exp.price} ⚡</span>
                    <span className="text-[var(--text-primary)] flex items-center gap-1">
                      <span>Balance: {sparksBalance}</span>
                      <Zap size={11} className="text-[#fb923c] fill-current" />
                    </span>
                  </div>
                </div>

                {/* Confirm Book CTA */}
                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading || !agreedSafety}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Requesting Booking...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Spend {exp.price} Sparks &amp; Book</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
