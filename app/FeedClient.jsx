'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Zap, MessageCircle, Heart, Share2, Calendar, MapPin, 
  Sparkles, Layers, BookOpen, UserCheck, MessageSquare, 
  Send, X, CheckCircle, Loader2, Star, Check 
} from 'lucide-react';

function avatarUrl(seed) {
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed || 'u')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export default function FeedClient({ currentUser, initialSparks }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedType, setFeedType] = useState('all'); // 'all' | 'spots' | 'posts'
  
  // Status Posting / Cabin Listing Form
  const [newPostText, setNewPostText] = useState('');
  const [isCabinListing, setIsCabinListing] = useState(false);
  const [cabinName, setCabinName] = useState('');
  const [cabinDesc, setCabinDesc] = useState('');
  const [cabinCost, setCabinCost] = useState('50');
  const [cabinAvailability, setCabinAvailability] = useState('Available Today, 4:00 PM - 7:00 PM');
  
  // Booking Modal State
  const [bookingSpot, setBookingSpot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [sparksBalance, setSparksBalance] = useState(initialSparks || 0);

  const loaderRef = useRef(null);
  const fetchedPagesRef = useRef(new Set());

  // Fetch feed items
  const fetchFeed = async (pageNum, typeFilter, isReset = false) => {
    const pageKey = `${typeFilter}_${pageNum}`;
    if (fetchedPagesRef.current.has(pageKey) && !isReset) return;
    if (loading) return;

    setLoading(true);
    fetchedPagesRef.current.add(pageKey);

    try {
      const res = await fetch(`/api/feed?page=${pageNum}&type=${typeFilter}`);
      const data = await res.json();
      if (res.ok) {
        if (isReset) {
          setItems(data.items);
          setPage(data.nextPage);
          fetchedPagesRef.current.clear();
          fetchedPagesRef.current.add(pageKey);
        } else {
          setItems(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newItems = data.items.filter(item => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
          setPage(data.nextPage);
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
      fetchedPagesRef.current.delete(pageKey);
    } finally {
      setLoading(false);
    }
  };

  // Reset feed on filter change
  useEffect(() => {
    fetchFeed(1, feedType, true);
  }, [feedType]);

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchFeed(page, feedType);
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading, feedType]);

  // Handle posting a new update / listing a cabin spot
  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !isCabinListing) return;

    let newItem = {};
    if (isCabinListing) {
      newItem = {
        id: `local_spot_${Date.now()}`,
        type: 'spot',
        hostId: currentUser?.id || 'self',
        hostName: currentUser?.full_name || 'My Space',
        year: `${currentUser?.year || '1st'} Year`,
        branch: currentUser?.branch || 'CSE',
        cabinName: cabinName || 'My Study Cabin Spot',
        desc: cabinDesc || newPostText,
        sparksCost: parseInt(cabinCost, 10) || 50,
        availability: cabinAvailability || 'Available now',
        avatar: currentUser?.full_name || 'self',
        tags: ['My Spot', 'Workspace']
      };
    } else {
      newItem = {
        id: `local_post_${Date.now()}`,
        type: 'post',
        authorName: currentUser?.full_name || 'My Account',
        avatar: currentUser?.full_name || 'self',
        content: newPostText,
        timestamp: 'Just now',
        likes: 0,
        comments: 0
      };
    }

    // Prepend to items list
    setItems(prev => [newItem, ...prev]);

    // Reset Form
    setNewPostText('');
    setIsCabinListing(false);
    setCabinName('');
    setCabinDesc('');
    setCabinCost('50');
  };

  // Confirm booking action
  const handleConfirmBooking = async () => {
    if (!bookingSpot) return;
    if (sparksBalance < bookingSpot.sparksCost) {
      alert('Insufficient Sparks! Please purchase more in your wallet.');
      setBookingSpot(null);
      return;
    }

    setBookingLoading(true);
    // Simulate booking transactions
    await new Promise(r => setTimeout(r, 1500));
    setBookingLoading(false);
    setBookingSuccess(true);
    setSparksBalance(prev => prev - bookingSpot.sparksCost);
  };

  return (
    <div className="space-y-6">
      
      {/* ── TOP ACTION BAR: POST / LIST WORKSPACE ─────────────────────── */}
      <form onSubmit={handlePostSubmit} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
            <img src={avatarUrl(currentUser?.full_name || 'me')} alt="My avatar" />
          </div>
          <div className="flex-1">
            <textarea
              placeholder={isCabinListing ? "Describe what you will study or do in your workspace..." : "Share a campus update, ask a question, or list a spot..."}
              value={newPostText}
              onChange={e => setNewPostText(e.target.value)}
              className="w-full bg-transparent border-0 resize-none text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-0 focus:outline-none p-1 min-h-[50px] leading-relaxed"
            />
          </div>
        </div>

        {/* Dynamic cabin fields if toggled */}
        {isCabinListing && (
          <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3 anim-scale-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Cabin / Space Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Library Cabin #302" 
                  value={cabinName}
                  onChange={e => setCabinName(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>Price (Sparks)</span>
                  <span className="text-[9px] text-[#fb923c] font-black uppercase">1 Spark = ₹1</span>
                </label>
                <input 
                  type="number" 
                  placeholder="50" 
                  value={cabinCost}
                  onChange={e => setCabinCost(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none"
                  min="10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Availability Window</label>
              <input 
                type="text" 
                placeholder="e.g. Available Today, 4:00 PM - 7:00 PM" 
                value={cabinAvailability}
                onChange={e => setCabinAvailability(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Space Description & Topics</label>
              <textarea 
                placeholder="Describe your workspace rules or the topic you want to collaborate on..." 
                value={cabinDesc}
                onChange={e => setCabinDesc(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] rounded-xl p-3 outline-none min-h-[60px]"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3.5">
          <button
            type="button"
            onClick={() => setIsCabinListing(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${
              isCabinListing 
                ? 'bg-[#6366f1]/10 border-[#6366f1] text-[#818cf8]' 
                : 'bg-[var(--bg-overlay)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers size={13} />
            <span>{isCabinListing ? "Study Spot Active" : "List Study Cabin"}</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <span>Post</span>
            <Send size={12} />
          </button>
        </div>
      </form>

      {/* ── FILTER TABS ────────────────────────────────────────────────── */}
      <div className="flex border-b border-[var(--border-subtle)] pb-1.5 gap-6">
        {[
          { id: 'all', label: 'All Feed' },
          { id: 'spots', label: 'Study Cabins' },
          { id: 'posts', label: 'Discussions' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFeedType(tab.id)}
            className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all relative ${
              feedType === tab.id 
                ? 'border-[#6366f1] text-[var(--text-primary)]' 
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── FEED LIST ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {items.map((item) => {
          if (item.type === 'spot') {
            return (
              /* SPOT CARD */
              <div key={item.id} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 hover:border-[#6366f1]/20 transition-all shadow-md relative overflow-hidden anim-scale-in">
                {/* Glow accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366f1] to-transparent" />
                
                <div className="flex items-start gap-4">
                  <Link href={`/users/${item.hostId}`} className="flex-shrink-0 group">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] group-hover:border-[#6366f1]/40 transition-colors">
                      <img src={avatarUrl(item.avatar)} alt={item.hostName} className="w-full h-full object-cover" />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <Link href={`/users/${item.hostId}`}>
                          <h4 className="text-xs font-black text-[var(--text-primary)] hover:text-[#818cf8] transition-colors truncate">
                            {item.hostName}
                          </h4>
                        </Link>
                        <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5">
                          {item.year} · {item.branch}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-500">
                        <Zap size={12} className="fill-current" />
                        <span className="text-xs font-black">{item.sparksCost}</span>
                      </div>
                    </div>

                    <h3 className="text-xs font-black text-[#818cf8] tracking-tight mb-2 mt-3 flex items-center gap-1.5 uppercase">
                      <BookOpen size={13} />
                      {item.cabinName}
                    </h3>
                    
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-semibold mb-4">
                      {item.desc}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      {item.tags?.map(tag => (
                        <span key={tag} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider">
                        <Calendar size={12} className="text-[#6366f1]" />
                        <span>{item.availability}</span>
                      </div>

                      <button
                        onClick={() => setBookingSpot(item)}
                        className="bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[11px] font-black uppercase tracking-wider px-4.5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md text-center"
                      >
                        Reserve Cabin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              /* POST CARD */
              <div key={item.id} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-sm space-y-4 anim-scale-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
                    <img src={avatarUrl(item.avatar)} alt={item.authorName} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[var(--text-primary)]">
                      {item.authorName}
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">
                      {item.timestamp}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  {item.content}
                </p>

                <div className="flex items-center gap-6 border-t border-[var(--border-subtle)] pt-3 text-[11px] text-[var(--text-muted)] font-bold">
                  <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <Heart size={14} />
                    <span>{item.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-[#6366f1] transition-colors">
                    <MessageSquare size={14} />
                    <span>{item.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors ml-auto">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            );
          }
        })}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="text-center py-12 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl">
            <Layers className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2.5" />
            <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">No feed items found</p>
          </div>
        )}

        {/* Infinite Scroll Trigger Spacer */}
        <div ref={loaderRef} className="h-10 flex items-center justify-center">
          {loading && <Loader2 className="w-5 h-5 text-[#6366f1] animate-spin" />}
        </div>
      </div>

      {/* ── STUDY CABIN BOOKING MODAL (OYO STYLE) ────────────────────────── */}
      {bookingSpot && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => !bookingLoading && setBookingSpot(null)}
        >
          <div 
            className="relative w-full max-w-sm rounded-3xl p-6 anim-scale-in"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close trigger */}
            {!bookingLoading && !bookingSuccess && (
              <button 
                onClick={() => setBookingSpot(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]"
              >
                <X size={15} />
              </button>
            )}

            {bookingSuccess ? (
              /* Success confirmation state */
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Cabin Spot Reserved!</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 font-semibold">
                  You have successfully booked <strong className="text-[var(--text-primary)]">{bookingSpot.cabinName}</strong> hosted by <strong className="text-[var(--text-primary)]">{bookingSpot.hostName}</strong>. {bookingSpot.sparksCost} Sparks have been transferred from your account. Check your notifications for confirmation details!
                </p>
                <button
                  onClick={() => { setBookingSpot(null); setBookingSuccess(false); }}
                  className="w-full py-3.5 rounded-xl text-xs font-black text-white bg-[#6366f1] hover:bg-[#4f46e5] active:scale-95 transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Standard Confirmation Modal */
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
                    <img src={avatarUrl(bookingSpot.avatar)} alt={bookingSpot.hostName} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Reserve Study Spot</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5">Host: {bookingSpot.hostName}</p>
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 mb-5 text-left">
                  {[
                    { label: 'Space Cabin', value: bookingSpot.cabinName },
                    { label: 'Availability', value: bookingSpot.availability },
                    { label: 'Amenities', value: 'Power Outlets, Fast Wi-Fi, Coffee' },
                    { label: 'Booking Code', value: `CS-${Math.floor(1000 + Math.random() * 9000)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider flex-shrink-0">{label}</span>
                      <span className="text-[11px] font-bold text-[var(--text-secondary)] text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Balance display */}
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl mb-5 text-xs font-bold">
                  <span className="text-[var(--text-muted)]">Available sparks balance</span>
                  <span className="text-[var(--text-primary)] flex items-center gap-1">
                    <Zap size={12} className="text-[#fb923c]" />
                    {sparksBalance}
                  </span>
                </div>

                {/* Final Booking Trigger */}
                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[11px] font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-md"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Reservation...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Spend {bookingSpot.sparksCost} Sparks &amp; Book</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-[var(--text-muted)] text-center mt-3 font-semibold">
                  Sparks will be deducted from your wallet immediately.{' '}
                  <Link href="/wallet" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Check balance</Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
