'use client';
// Force compile: 2026-07-16
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap, MessageCircle, Heart, Share2, Calendar, MapPin,
  Sparkles, Layers, BookOpen, UserCheck, MessageSquare,
  Send, X, CheckCircle, Loader2, Star, Check, Search,
  ShieldAlert, Clock, AlertTriangle, ShieldCheck, Compass, Users,
  Coffee, Briefcase, Camera, Activity, Music, Bell, ChevronRight
} from 'lucide-react';
import { mockDb } from '../lib/mockDatabase';
import confetti from 'canvas-confetti';

import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';

// Pass the full user object for best resolution (photo > instagram > cartoon)
function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  if (typeof userOrSeed === 'string' && typeof window !== 'undefined') {
    const users = mockDb.getUsers();
    const found = users.find(u => u.full_name === userOrSeed || u.id === userOrSeed || u.uid === userOrSeed);
    if (found) return getUserAvatarUrl(found);
  }
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

const cardColorsLight = [
  { bg: 'from-[#fff5f5] to-[#ffe4e6] border-[#fecdd3]', text: 'text-[#4c0519]', sub: 'text-[#be123c]', btn: 'bg-white text-[#be123c] border-[#fecdd3] hover:bg-[#fff5f5]' },
  { bg: 'from-[#f0fdf4] to-[#dcfce7] border-[#bbf7d0]', text: 'text-[#052e16]', sub: 'text-[#15803d]', btn: 'bg-white text-[#15803d] border-[#bbf7d0] hover:bg-[#f0fdf4]' },
  { bg: 'from-[#ecfeff] to-[#cffafe] border-[#a5f3fc]', text: 'text-[#083344]', sub: 'text-[#0e7490]', btn: 'bg-white text-[#0e7490] border-[#a5f3fc] hover:bg-[#ecfeff]' }
];

const cardColorsDark = [
  { bg: 'from-rose-950/70 to-rose-900/50 border-rose-500/25', text: 'text-rose-50', sub: 'text-rose-300', btn: 'bg-rose-500/20 text-rose-200 border-rose-500/30 hover:bg-rose-500/30' },
  { bg: 'from-emerald-950/70 to-emerald-900/50 border-emerald-500/25', text: 'text-emerald-50', sub: 'text-emerald-300', btn: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/30' },
  { bg: 'from-cyan-950/70 to-cyan-900/50 border-cyan-500/25', text: 'text-cyan-50', sub: 'text-cyan-300', btn: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30 hover:bg-cyan-500/30' }
];

function getCardColors(index, isDark) {
  const list = isDark ? cardColorsDark : cardColorsLight;
  return list[index % list.length];
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

  // Redesign Home page active modals and deck states
  const [stackIndex, setStackIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  // Form states for creating experience
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Coffee');
  const [newExpPrice, setNewExpPrice] = useState(100);
  const [newExpDuration, setNewExpDuration] = useState(45);
  const [newExpLocation, setNewExpLocation] = useState('');
  const [newExpDays, setNewExpDays] = useState('Monday');
  const [newExpSlots, setNewExpSlots] = useState('5:00 PM');
  const [createLoading, setCreateLoading] = useState(false);

  const [joinedGroups, setJoinedGroups] = useState({});
  const [groupFilter, setGroupFilter] = useState('All');

  // Load joined groups on mount
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`joined_groups_${currentUser.id}`);
      if (stored) {
        try {
          setJoinedGroups(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [currentUser]);

  const saveJoinedGroups = (nextJoined) => {
    setJoinedGroups(nextJoined);
    if (currentUser && typeof window !== 'undefined') {
      localStorage.setItem(`joined_groups_${currentUser.id}`, JSON.stringify(nextJoined));
    }
  };

  const handleJoinGroup = (group) => {
    if (!currentUser) {
      alert("Please log in to join campus groups!");
      return;
    }
    if (joinedGroups[group.name]) {
      alert(`Opening ${group.name} group chat...`);
      return;
    }

    if (group.isPaid) {
      if (sparksBalance < group.price) {
        alert(`Insufficient Sparks! You need ${group.price} Sparks to join this group. Current balance: ${sparksBalance} Sparks.`);
        return;
      }
      const confirmJoin = window.confirm(`Do you want to subscribe to ${group.name} for ${group.price} Sparks?`);
      if (confirmJoin) {
        setSparksBalance(prev => {
          const nextBal = prev - group.price;
          const w = mockDb.getWallet(currentUser.id);
          if (w) {
            w.purchased = Math.max(0, (w.purchased || 0) - group.price);
            mockDb.saveWallet(currentUser.id, w);
          }
          mockDb.addTransaction(currentUser.id, {
            type: 'SPEND',
            amount: group.price,
            description: `Subscribed to ${group.name}`,
            status: 'COMPLETED'
          });
          return nextBal;
        });
        saveJoinedGroups({ ...joinedGroups, [group.name]: true });
        alert(`Successfully joined ${group.name}!`);
      }
    } else {
      saveJoinedGroups({ ...joinedGroups, [group.name]: true });
      alert(`Joined ${group.name} successfully!`);
    }
  };

  // Load from local storage DB on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Fetch initial data
      setExperiences(mockDb.getExperiences());
      setBookings(mockDb.getBookings());
      setPopularHosts(mockDb.getUsers().filter(u => u.isIdOn !== false && u.id !== currentUser?.id));
      if (currentUser) {
        const u = mockDb.getUser(currentUser.id);
        if (u) setUserData(u);
        const w = mockDb.getWallet(currentUser.id);
        setSparksBalance((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
      }
      setDbHydrated(true);

      const handleUpdate = () => {
        setExperiences(mockDb.getExperiences());
        setBookings(mockDb.getBookings());
        setPopularHosts(mockDb.getUsers().filter(u => u.isIdOn !== false && u.id !== currentUser?.id));
        if (currentUser) {
          const u = mockDb.getUser(currentUser.id);
          if (u) setUserData(u);
          const w = mockDb.getWallet(currentUser.id);
          setSparksBalance((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
        }
      };

      window.addEventListener('wallet-updated', handleUpdate);
      window.addEventListener('profile-updated', handleUpdate);
      return () => {
        window.removeEventListener('wallet-updated', handleUpdate);
        window.removeEventListener('profile-updated', handleUpdate);
      };
    }
  }, [currentUser]);

  // Synchronise state with local storage updates
  const refreshDbState = () => {
    setExperiences(mockDb.getExperiences());
    setBookings(mockDb.getBookings());
    setPopularHosts(mockDb.getUsers().filter(u => u.isIdOn !== false && u.id !== currentUser?.id));
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

  const handleCreateExperience = () => {
    if (!newExpTitle.trim() || !newExpLocation.trim()) {
      alert('Please fill in all fields!');
      return;
    }
    setCreateLoading(true);
    const newExp = {
      title: newExpTitle,
      category: newExpCategory,
      price: Number(newExpPrice),
      duration: Number(newExpDuration),
      location: newExpLocation,
      days: [newExpDays],
      slots: [newExpSlots],
      hostId: currentUser.id,
      rating: 5.0,
      tags: [newExpCategory.toLowerCase()]
    };
    mockDb.createExperience(newExp);
    setCreateLoading(false);
    setShowCreateModal(false);
    alert('Experience created successfully!');
    // Clear fields
    setNewExpTitle('');
    setNewExpLocation('');
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
    <div className="space-y-8 pb-20 pt-4">

      {/* ── HEADER SECTION ────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2.5xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Hi, {userData?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Student'} 👋
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-widest">
            Let's make today amazing!
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sparks balance badge */}
          <Link href="/wallet" className="flex items-center gap-1.5 bg-[var(--accent-dim)] border border-[var(--accent-glow)] rounded-full px-3 py-2 text-xs font-black text-[var(--accent)] hover:opacity-90 transition-opacity shadow-sm">
            <Zap size={11} className="fill-current text-amber-500 animate-pulse" />
            <span>{sparksBalance} ⚡</span>
          </Link>
          
          <Link href="/notifications" className="w-10 h-10 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all relative">
            <Bell size={16} />
            {activeUserBookings.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            )}
          </Link>
          
          <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-overlay)] border border-[var(--border-subtle)] flex items-center justify-center hover:scale-105 transition-all shadow-sm">
            <img src={avatarUrl(userData)} alt="profile" className="w-full h-full object-cover" />
          </Link>
        </div>
      </div>

      {/* Active Meetings Quick Banner */}
      {currentUser && activeUserBookings.length > 0 && (
        <button
          onClick={() => setShowBookingsModal(true)}
          className="w-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 text-emerald-400 p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-between hover:from-emerald-500/15 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span>You have {activeUserBookings.length} active meeting{activeUserBookings.length > 1 ? 's' : ''} today</span>
          </div>
          <span className="text-[9px] font-black text-white bg-emerald-600/40 px-2.5 py-1 rounded-lg">View Code</span>
        </button>
      )}

      {/* ── UPCOMING FOR YOU (STACKED CARD CAROUSEL) ─────────── */}
      {(() => {
        const defaultDeck = [
          { id: 'exp_1', title: 'Coffee Connect with Ananya', hostId: 'ananya', location: 'Campus Cafe', duration: 45, price: 250, days: ['Monday'], slots: ['5:00 PM'] },
          { id: 'exp_2', title: 'Study Together with Aarav', hostId: 'aarav', location: 'Central Library', duration: 60, price: 150, days: ['Monday'], slots: ['4:00 PM'] },
          { id: 'exp_3', title: 'Portfolio Review with Neha', hostId: 'neha', location: 'Design Studio Loft', duration: 30, price: 200, days: ['Monday'], slots: ['3:00 PM'] }
        ];
        const deckExps = experiences.filter(e => e.hostId !== currentUser?.id);
        const displayDeck = deckExps.length > 0 ? deckExps.slice(0, 3) : defaultDeck;

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">Upcoming For You</h3>
              <button
                onClick={() => setStackIndex(prev => (prev + 1) % displayDeck.length)}
                className="text-[10px] font-black text-[var(--accent)] hover:text-white uppercase tracking-widest flex items-center gap-1 cursor-pointer"
              >
                <span>Cycle Deck</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {/* Deck Stack */}
            <div className="relative h-[240px] w-full select-none">
              {displayDeck.map((exp, idx) => {
                const offset = (idx - stackIndex + displayDeck.length) % displayDeck.length;
                const isFront = offset === 0;
                const isSecond = offset === 1;
                const isThird = offset === 2;

                let transform = '';
                let zIndex = 0;
                let opacity = 0;
                let rotate = '0deg';

                if (isFront) {
                  transform = 'translate3d(0, 0, 0) scale(1)';
                  zIndex = 30;
                  opacity = 1;
                  rotate = '0deg';
                } else if (isSecond) {
                  transform = 'translate3d(12px, 8px, 0) scale(0.96)';
                  zIndex = 20;
                  opacity = 0.95;
                  rotate = '2deg';
                } else if (isThird) {
                  transform = 'translate3d(-14px, 12px, 0) scale(0.92)';
                  zIndex = 10;
                  opacity = 0.85;
                  rotate = '-3deg';
                }

                const host = mockDb.getUser(exp.hostId);
                const palette = getCardColors(idx, typeof window !== 'undefined' && document.documentElement.classList.contains('dark'));

                return (
                  <div
                    key={exp.id}
                    onClick={() => {
                      if (!isFront) {
                        setStackIndex(idx);
                      }
                    }}
                    className={`absolute top-0 left-0 w-full h-full rounded-[2rem] p-6 border transition-all duration-500 ease-out flex flex-col justify-between shadow-[0_15px_30px_-5px_rgba(0,0,0,0.15)] bg-gradient-to-br ${palette.bg} ${palette.text} ${isFront ? 'cursor-default pointer-events-auto' : 'cursor-pointer pointer-events-none'}`}
                    style={{
                      transform: `${transform} rotate(${rotate})`,
                      zIndex,
                      opacity,
                    }}
                  >
                    <div className="space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                          ✨ Recommended
                        </span>
                        <div className="w-8 h-1.5 bg-current/25 rounded-full" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-lg font-black leading-tight tracking-tight uppercase">
                          {exp.title}
                        </h4>
                        <p className={`text-[11px] font-bold ${palette.sub}`}>
                          with {host?.full_name || exp.hostId}
                        </p>
                      </div>

                      <div className="space-y-0.5 text-[10.5px] font-bold uppercase tracking-wider opacity-80">
                        <p>{exp.location.split(',')[0]}</p>
                        <p>Today, 5:00 PM · {exp.duration} min</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-current/15 pt-4">
                      <div className="flex items-center gap-1 text-sm font-black">
                        <span>{exp.price}</span>
                        <Zap size={13} className="fill-current text-amber-500" />
                      </div>
                      
                      {isFront ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExp(exp);
                          }}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${palette.btn}`}
                        >
                          Book Now
                        </button>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                          Tap to view
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── QUICK ACTIONS ─────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">Quick Actions</h3>
        
        <div className="grid grid-cols-4 gap-2">
          {/* Find Hosts */}
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('All');
              document.getElementById('classmates-available')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-2 text-center group cursor-pointer focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:border dark:border-emerald-800/30 dark:text-emerald-400 group-hover:scale-105 group-active:scale-95 shadow-sm">
              <UserCheck size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              Find Hosts
            </span>
          </button>

          {/* Join Groups */}
          <button
            onClick={() => {
              document.getElementById('campus-groups')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-2 text-center group cursor-pointer focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:border dark:border-blue-800/30 dark:text-blue-400 group-hover:scale-105 group-active:scale-95 shadow-sm">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              Join Groups
            </span>
          </button>

          {/* Create Event */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center gap-2 text-center group cursor-pointer focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:border dark:border-rose-800/30 dark:text-rose-400 group-hover:scale-105 group-active:scale-95 shadow-sm">
              <Calendar size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              Create Event
            </span>
          </button>

          {/* My Bookings */}
          <button
            onClick={() => setShowBookingsModal(true)}
            className="flex flex-col items-center gap-2 text-center group cursor-pointer focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:border dark:border-indigo-800/30 dark:text-indigo-400 group-hover:scale-105 group-active:scale-95 shadow-sm">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              Bookings
            </span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & CATEGORIES ───────── */}
      <div className="space-y-4 pt-2">
        <div className="relative">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campus experiences, hosts, tags, or public locations..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent)]/40 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all font-semibold shadow-inner"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { name: 'All', value: 'All', Icon: Compass },
            { name: 'Coffee', value: 'Coffee', Icon: Coffee },
            { name: 'Study', value: 'Study', Icon: BookOpen },
            { name: 'Startup', value: 'Startup', Icon: Briefcase },
            { name: 'Photo', value: 'Photography', Icon: Camera },
            { name: 'Sports', value: 'Sports', Icon: Activity },
            { name: 'Music', value: 'Music', Icon: Music },
          ].map((cat) => {
            const isSelected = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all duration-200 flex-shrink-0 cursor-pointer text-[10px] font-bold uppercase tracking-wider ${isSelected
                    ? 'text-white border-transparent'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-mid)]'
                  }`}
                style={isSelected ? { background: 'var(--accent)', boxShadow: 'var(--shadow-glow)' } : {}}
              >
                <cat.Icon size={12} strokeWidth={isSelected ? 2.5 : 1.75} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TRENDING THIS WEEK ─────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Trending This Week</h3>
            <span className="text-xs">🔥</span>
          </div>
          <Link href="/experiences" className="text-[10px] font-black text-[var(--accent)] hover:text-white uppercase tracking-widest">
            View all
          </Link>
        </div>

        {filteredExperiences.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl text-xs text-[var(--text-muted)] italic">
            No matching experiences found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExperiences.slice(0, 4).map((exp, idx) => {
              // Colors for icons on the left
              const iconThemes = [
                { bg: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400', Icon: Briefcase },
                { bg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400', Icon: BookOpen },
                { bg: 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400', Icon: Sparkles },
                { bg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400', Icon: Coffee }
              ];
              const theme = iconThemes[idx % iconThemes.length];

              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExp(exp)}
                  className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] rounded-2xl cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${theme.bg}`}>
                      <theme.Icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-[var(--text-primary)] uppercase truncate pr-2">
                        {exp.title}
                      </h4>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider">
                        {exp.days[0]} · {exp.location.split(',')[0]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[var(--accent-dim)] border border-[var(--accent-glow)] text-[var(--accent)] text-xs font-black px-3.5 py-1.5 rounded-full flex-shrink-0 shadow-sm">
                    <span>{exp.price}</span>
                    <Zap size={11} className="fill-current text-amber-500 animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CLASSMATES AVAILABLE TO MEET (Campus Suggestions Carousel) ── */}
      <div className="space-y-3.5">
        <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Classmates Available</h3>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-0.5">Students available to co-study or meet up on campus</p>
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
              <div className="relative w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-[var(--accent-gradient-from)] to-[var(--accent-gradient-to)] transition-transform duration-300 group-hover:scale-105 shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--bg-elevated)]">
                  <img src={avatarUrl(host)} alt={host.full_name} className="w-full h-full object-cover" />
                </div>
                {host.instagram && (
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] border border-[var(--bg-elevated)] flex items-center justify-center text-[9px] shadow-md select-none">
                    📸
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-[var(--text-primary)] truncate max-w-[75px] group-hover:text-[var(--accent)] transition-colors">
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


      {/* ── CAMPUS GROUPS & CHANNELS (WHATSAPP STYLE) ────────────────── */}
      {(() => {
        const campusGroups = [
          { name: 'Google Developer Student Club', category: 'Tech', isPaid: false, price: 0, desc: 'Official updates on campus hackathons, coding tasks & bootcamps.', logo: 'GD', members: 180, isOfficial: true },
          { name: 'Figma UI/UX Masterclass VIP', category: 'Design', isPaid: true, price: 50, desc: 'Premium design templates, personal project reviews & job opportunities.', logo: 'FM', members: 42, isOfficial: false },
          { name: 'Campus Symphony Chat', category: 'Music', isPaid: false, price: 0, desc: 'Open mic coordination, jamming sessions & campus playlist sharing.', logo: 'CS', members: 96, isOfficial: true },
          { name: 'Placement Prep & Referrals', category: 'Career', isPaid: true, price: 120, desc: 'Placement test leaks, interview preparation sheets & direct referrals.', logo: 'PP', members: 115, isOfficial: true },
          { name: 'Gladiators FC (Sports)', category: 'Athletics', isPaid: false, price: 0, desc: 'Match schedule updates, football practice slots & gym meets.', logo: 'GF', members: 140, isOfficial: false }
        ];

        const filteredGroups = campusGroups.filter(g => {
          if (groupFilter === 'Free') return !g.isPaid;
          if (groupFilter === 'Premium') return g.isPaid;
          return true;
        });

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--border-subtle)] pb-3 gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Campus Groups & Channels</h3>
                <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-0.5">Join paid or free campus discussion groups and channels</p>
              </div>
              
              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                {['All', 'Free', 'Premium'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setGroupFilter(filter)}
                    className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                      groupFilter === filter
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden divide-y divide-[var(--border-subtle)]/60 shadow-lg">
              {filteredGroups.map((group) => {
                const hasJoined = joinedGroups[group.name];
                return (
                  <div key={group.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors gap-3">
                    <div className="flex items-start gap-3.5">
                      {/* Channel Icon */}
                      <div className="w-11 h-11 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-black text-[var(--accent)] flex-shrink-0 shadow-sm relative">
                        {group.logo}
                        {group.isOfficial && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-[var(--bg-elevated)] shadow">
                            <Check size={8} className="text-white stroke-[3.5]" />
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-1">
                            {group.name}
                          </h4>
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                            {group.category}
                          </span>
                          <span className="text-[8px] font-bold text-[var(--text-muted)]">
                            • {group.members + (hasJoined ? 1 : 0)} followers
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-[var(--text-secondary)] font-semibold leading-relaxed">
                          {group.desc}
                        </p>

                        {/* Price Tag */}
                        <div className="pt-0.5">
                          {group.isPaid ? (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                              ⚡ {group.price} Sparks
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              Free Group
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 self-end sm:self-auto pt-1 sm:pt-0">
                      {hasJoined ? (
                        <button
                          onClick={() => handleJoinGroup(group)}
                          className="w-full sm:w-auto bg-emerald-500/10 border border-emerald-500/35 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={11} className="stroke-[3.5]" />
                          <span>Chat Opened</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinGroup(group)}
                          className={`w-full sm:w-auto text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                            group.isPaid
                              ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-md'
                              : 'bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:bg-[var(--accent-dim)] text-[var(--text-primary)]'
                          }`}
                        >
                          {group.isPaid ? `Subscribe (⚡ ${group.price})` : 'Join Group'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}


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
                  className="w-full py-3.5 rounded-xl text-xs font-black text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Got it
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5 border-b border-[var(--border-subtle)] pb-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
                    <img src={avatarUrl(mockDb.getUser(selectedExp.hostId))} alt="host" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Meet Host</h3>
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
                      <span>Requesting Meetup...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Spend {selectedExp.price} Sparks &amp; Meet</span>
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
                      className={`text-[9px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all cursor-pointer ${selected
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
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs font-semibold p-3 outline-none text-[var(--text-primary)] min-h-[70px] focus:border-[var(--accent)]"
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
                Status: <span className="text-[var(--accent)]">{selectedActiveBooking.status}</span>
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
                        className={`w-full h-full rounded-sm ${(i % 5 === 0 || i < 5 || i > 20 || i % 6 === 0) ? 'bg-black' : 'bg-transparent'
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
                          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-black tracking-widest text-center text-[var(--text-primary)] w-28 outline-none focus:border-[var(--accent)]"
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

      {/* ── CREATE CUSTOM EXPERIENCE MODAL ───────────────────────── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => !createLoading && setShowCreateModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[2rem] p-6 space-y-4 anim-scale-in text-left"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            {!createLoading && (
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white transition-colors bg-[var(--bg-surface)]"
              >
                <X size={15} />
              </button>
            )}

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Host Campus Meet</h3>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-1">Create a session other students can book</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Meet Title</label>
                <input
                  type="text"
                  placeholder="e.g. Badminton Match / Startup Brainstorm"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={newExpCategory}
                    onChange={(e) => setNewExpCategory(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none cursor-pointer"
                  >
                    {['Coffee', 'Study', 'Startup', 'Photography', 'Sports', 'Music'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Duration (Mins)</label>
                  <select
                    value={newExpDuration}
                    onChange={(e) => setNewExpDuration(Number(e.target.value))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none cursor-pointer"
                  >
                    {[15, 30, 45, 60, 90, 120].map(d => (
                      <option key={d} value={d}>{d} Mins</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Price (Sparks)</label>
                  <input
                    type="number"
                    min={50}
                    max={500}
                    step={25}
                    value={newExpPrice}
                    onChange={(e) => setNewExpPrice(Number(e.target.value))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Block 3 Cafeteria"
                    value={newExpLocation}
                    onChange={(e) => setNewExpLocation(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Available Day</label>
                  <select
                    value={newExpDays}
                    onChange={(e) => setNewExpDays(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none cursor-pointer"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Time Slot</label>
                  <select
                    value={newExpSlots}
                    onChange={(e) => setNewExpSlots(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none cursor-pointer"
                  >
                    {['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateExperience}
              disabled={createLoading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-md"
            >
              {createLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Creating Meetup...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>List Campus Meetup</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── MY BOOKINGS MODAL ─────────────────────────────────────── */}
      {showBookingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowBookingsModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-[2.5rem] p-6 space-y-4 anim-scale-in text-left max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowBookingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white transition-colors bg-[var(--bg-surface)]"
            >
              <X size={15} />
            </button>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Your Campus Meetings</h3>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-1">Track active bookings and host requests</p>
            </div>

            <div className="space-y-4">
              {/* Sent Requests (Guest) */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-1.5">
                  Meetings You Booked
                </h4>
                {bookings.filter(b => b.guestId === currentUser?.id).length === 0 ? (
                  <p className="text-[10px] text-[var(--text-muted)] italic py-1">No bookings made yet.</p>
                ) : (
                  <div className="space-y-2">
                    {bookings.filter(b => b.guestId === currentUser?.id).map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedActiveBooking(b);
                          setShowBookingsModal(false);
                        }}
                        className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div>
                          <h5 className="text-[11px] font-bold text-white uppercase truncate max-w-[180px]">{b.title}</h5>
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-semibold">
                            Host: {b.hostName} · {b.date} · {b.time}
                          </p>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          b.status === 'Requested'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            : b.status === 'Confirmed'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-[var(--accent-dim)] border-[var(--accent-glow)] text-[var(--accent)]'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Received Requests (Host) */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-1.5">
                  Requests from Classmates
                </h4>
                {bookings.filter(b => b.hostId === currentUser?.id).length === 0 ? (
                  <p className="text-[10px] text-[var(--text-muted)] italic py-1">No requests received yet.</p>
                ) : (
                  <div className="space-y-2">
                    {bookings.filter(b => b.hostId === currentUser?.id).map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl space-y-2.5"
                      >
                        <div
                          onClick={() => {
                            setSelectedActiveBooking(b);
                            setShowBookingsModal(false);
                          }}
                          className="cursor-pointer"
                        >
                          <h5 className="text-[11px] font-bold text-white uppercase truncate max-w-[200px]">{b.title}</h5>
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-semibold">
                            Guest: {b.guestName} · {b.date} · {b.time}
                          </p>
                        </div>

                        {b.status === 'Requested' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(b.id)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase py-1.5 rounded-lg transition-all"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(b.id)}
                              className="flex-1 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/35 text-rose-400 text-[9px] font-black uppercase py-1.5 rounded-lg transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => {
                              setSelectedActiveBooking(b);
                              setShowBookingsModal(false);
                            }}
                            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[9px] font-black uppercase py-1.5 rounded-lg transition-all"
                          >
                            Verify Meeting Code
                          </button>
                        )}

                        {b.status !== 'Requested' && b.status !== 'Confirmed' && (
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-[var(--text-muted)]">Status:</span>
                            <span className="text-[var(--accent)] font-bold uppercase">{b.status}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
