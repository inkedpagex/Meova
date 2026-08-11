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
  Coffee, Briefcase, Camera, Activity, Music, Bell, ChevronRight,
  SlidersHorizontal, Trophy, Gamepad, TrendingUp, HelpCircle, Film
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

function getExpCardTheme(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('coffee') || cat.includes('meet') || cat.includes('startup')) {
    return {
      bg: 'bg-[#f5f3ff] border-[#ddd6fe]/50',
      text: 'text-[#7c3aed]',
      muted: 'text-[#9061f9]',
      circleBg: 'bg-[#ede9fe]',
      priceBg: 'bg-[#ede9fe] text-[#7c3aed]'
    };
  }
  if (cat.includes('study') || cat.includes('class') || cat.includes('learn') || cat.includes('design') || cat.includes('together')) {
    return {
      bg: 'bg-[#fffbeb] border-[#fef3c7]/50',
      text: 'text-[#d97706]',
      muted: 'text-[#b45309]',
      circleBg: 'bg-[#fef3c7]',
      priceBg: 'bg-[#fef3c7] text-[#d97706]'
    };
  }
  // Default to green (Sports, coding, general)
  return {
    bg: 'bg-[#f0fdf4] border-[#bbf7d0]/50',
    text: 'text-[#16a34a]',
    muted: 'text-[#15803d]',
    circleBg: 'bg-[#dcfce7]',
    priceBg: 'bg-[#dcfce7] text-[#16a34a]'
  };
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
  const [dismissedVibes, setDismissedVibes] = useState({});

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
      router.push('/login');
      return;
    }
    if (joinedGroups[group.name]) {
      // Already joined — open group in messages
      router.push(`/messages?user=${encodeURIComponent(group.name)}`);
      return;
    }

    if (group.isPaid) {
      if (sparksBalance < group.price) {
        router.push('/wallet');
        return;
      }
      const confirmJoin = window.confirm(`Join ${group.name} for ${group.price} Sparks?`);
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
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        setTimeout(() => router.push(`/messages?user=${encodeURIComponent(group.name)}`), 600);
      }
    } else {
      saveJoinedGroups({ ...joinedGroups, [group.name]: true });
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.6 } });
      setTimeout(() => router.push(`/messages?user=${encodeURIComponent(group.name)}`), 600);
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

  const defaultVibeUsers = [
    {
      id: 'aarav_sharma',
      full_name: 'Aarav',
      year: '3rd',
      branch: 'CSE',
      college: 'GLA University',
      interests: ['Coding', 'Gaming', 'AI'],
      photo_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav'
    },
    {
      id: 'priya_p',
      full_name: 'Priya',
      year: '2nd',
      branch: 'BBA',
      college: 'GLA University',
      interests: ['Music', 'Art', 'Travel'],
      photo_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya'
    }
  ];

  const vibeUsers = popularHosts.length > 0
    ? popularHosts.map(u => ({
        id: u.id,
        full_name: u.full_name,
        year: u.year || '3rd',
        branch: u.branch || 'CSE',
        college: u.college || 'GLA University',
        interests: u.interests?.slice(0, 3) || ['Tech', 'Design', 'Music'],
        photo_url: avatarUrl(u)
      }))
    : defaultVibeUsers;

  const defaultExperiences = [
    { id: 'exp_1', title: 'Coffee Connect', category: 'Coffee', price: 250, days: ['Today'], slots: ['5:00 PM'], location: 'Campus Cafe', hostId: 'ananya' },
    { id: 'exp_2', title: 'Study Together', category: 'Study', price: 150, days: ['Tomorrow'], slots: ['11:00 AM'], location: 'Library Central', hostId: 'aarav' },
    { id: 'exp_3', title: 'Badminton Match', category: 'Sports', price: 200, days: ['Fri'], slots: ['4:00 PM'], location: 'Sports Complex', hostId: 'neha' }
  ];

  const topExps = filteredExperiences.length > 0 ? filteredExperiences.slice(0, 4) : defaultExperiences;

  const GROUP_ICON_MAP = { Tech: 'code', Design: 'palette', Music: 'music', Career: 'briefcase', Athletics: 'trophy', default: 'users' };

  const campusGroups = [
    { name: 'Google Developer Student Club', category: 'Tech', isPaid: false, price: 0, desc: 'Official updates on campus hackathons, coding tasks & bootcamps.', members: 180, isOfficial: true },
    { name: 'Figma UI/UX Masterclass VIP', category: 'Design', isPaid: true, price: 50, desc: 'Premium design templates, personal project reviews & job opportunities.', members: 42, isOfficial: false },
    { name: 'Campus Symphony Chat', category: 'Music', isPaid: false, price: 0, desc: 'Open mic coordination, jamming sessions & campus playlist sharing.', members: 96, isOfficial: true },
    { name: 'Placement Prep & Referrals', category: 'Career', isPaid: true, price: 120, desc: 'Interview preparation sheets & direct referrals.', members: 115, isOfficial: true },
    { name: 'Gladiators FC', category: 'Athletics', isPaid: false, price: 0, desc: 'Match schedule updates, football practice slots & gym meets.', members: 140, isOfficial: false }
  ];

  const GROUP_THEME = {
    Tech:      { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe', Icon: BookOpen },
    Design:    { bg: '#fdf4ff', color: '#a855f7', border: '#e9d5ff', Icon: Layers },
    Music:     { bg: '#fdf2f8', color: '#ec4899', border: '#fbcfe8', Icon: Music },
    Career:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', Icon: Briefcase },
    Athletics: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', Icon: Activity },
    default:   { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', Icon: Users },
  };

  const filteredGroups = campusGroups.filter(g => {
    if (groupFilter === 'Free') return !g.isPaid;
    if (groupFilter === 'Premium') return g.isPaid;
    return true;
  });

  return (
    <div className="space-y-6 pb-24 pt-4 px-2 select-none">

      {/* ── HEADER SECTION ────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
            Hi, {userData?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Chirag'}
          </h1>
          <p className="text-xs text-zinc-500 font-bold mt-1">
            Who are you meeting today?
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sparks balance badge */}
          <Link href="/wallet" className="flex items-center gap-1.5 bg-[#f3f0ff] border border-[#ddd6fe]/50 rounded-full px-3.5 py-2 text-xs font-black text-[#7c3aed] hover:opacity-90 transition-opacity shadow-sm">
            <Zap size={11} className="fill-current text-[#7c3aed]" />
            <span>{sparksBalance}</span>
          </Link>
          
          <Link href="/notifications" className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-800 hover:text-indigo-600 transition-all relative shadow-sm">
            <Bell size={18} className="text-zinc-800" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#7c3aed] rounded-full border border-white" />
          </Link>
        </div>
      </div>

      {/* ── SEARCH BAR ─────────────────────────── */}
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people, experiences, groups..."
            className="w-full bg-[#f3f4f6]/60 border border-transparent focus:border-zinc-205 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold text-zinc-850 placeholder-zinc-500/80 focus:outline-none transition-all shadow-inner"
          />
        </div>
        <button
          type="button"
          className="w-11 h-11 rounded-2xl bg-[#f3f4f6]/60 border border-transparent flex items-center justify-center text-zinc-650 hover:bg-[#eaebeb] transition-all cursor-pointer flex-shrink-0"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* ── PEOPLE YOU MIGHT VIBE WITH ─────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-zinc-950 tracking-tight">People you might vibe with</h3>
          <Link href="/discover" className="text-xs font-black text-[#7c3aed] hover:text-indigo-850 transition-colors">
            See all
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {vibeUsers.map((user) => {
            if (dismissedVibes[user.id]) return null;
            return (
              <div
                key={user.id}
                className="w-[185px] flex-shrink-0 bg-white border border-zinc-100 rounded-[2rem] p-5 flex flex-col items-center justify-between text-center shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
              >
                {/* Avatar with circle bg */}
                <div className="relative w-[84px] h-[84px] rounded-full bg-[#e8e4ff] p-[3px] mb-3.5 flex items-center justify-center">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    <img src={getUserAvatarUrl(user)} alt={user.full_name} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Name & online dot */}
                <div className="flex items-center gap-1.5 mb-1 justify-center">
                  <span className="text-xs font-black text-zinc-950 uppercase tracking-tight truncate max-w-[120px]">
                    {user.full_name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>

                {/* Details */}
                <p className="text-[9.5px] font-black text-zinc-400 uppercase tracking-wider leading-none">
                  {user.year} Year · {user.branch}
                </p>
                <p className="text-[9.5px] font-bold text-zinc-400 mt-1 uppercase tracking-wider leading-none">
                  {user.college}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3 justify-center mb-4">
                  {user.interests.map((tag) => (
                    <span key={tag} className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full bg-[#f3f0ff] text-[#7c3aed]">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="w-full flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setDismissedVibes(prev => ({ ...prev, [user.id]: true }))}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confetti({ particleCount: 80, spread: 55, origin: { y: 0.6 } });
                      setDismissedVibes(prev => ({ ...prev, [user.id]: true }));
                      router.push(`/messages?user=${encodeURIComponent(user.full_name)}`);
                    }}
                    className="flex-1 h-9 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TOP EXPERIENCES FOR YOU ─────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-zinc-950 tracking-tight">Top Experiences for you</h3>
          <Link href="/experiences" className="text-xs font-black text-[#7c3aed] hover:text-[#5b21b6] transition-colors">
            See all
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {topExps.map((exp) => {
            const theme = getExpCardTheme(exp.category);
            const cat = (exp.category || '').toLowerCase();
            let ExpIcon = Coffee;
            if (cat.includes('study') || cat.includes('learn') || cat.includes('together')) ExpIcon = BookOpen;
            else if (cat.includes('sport') || cat.includes('match') || cat.includes('fitness') || cat.includes('badminton')) ExpIcon = Activity;
            else if (cat.includes('music') || cat.includes('jam')) ExpIcon = Music;
            else if (cat.includes('design') || cat.includes('figma') || cat.includes('art')) ExpIcon = Layers;
            else if (cat.includes('camera') || cat.includes('photo')) ExpIcon = Camera;

            return (
              <div
                key={exp.id}
                onClick={() => setSelectedExp(exp)}
                className={`w-[175px] flex-shrink-0 border rounded-3xl p-4 flex flex-col cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${theme.bg}`}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
              >
                {/* Icon circle */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${theme.circleBg}`}>
                  <ExpIcon size={20} className={theme.text} strokeWidth={2} />
                </div>

                {/* Title */}
                <h4 className={`text-[11px] font-black uppercase tracking-wide leading-tight ${theme.text}`}>
                  {exp.title}
                </h4>

                {/* Schedule */}
                <p className="text-[9.5px] font-bold text-zinc-500 mt-2 uppercase tracking-wider">
                  {exp.days ? exp.days[0] : 'Today'} · {exp.slots ? exp.slots[0] : '5:00 PM'}
                </p>

                {/* Location */}
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={8} className="text-zinc-400 flex-shrink-0" />
                  <p className="text-[9px] font-semibold text-zinc-400 truncate">
                    {exp.location?.split(',')[0] || 'Campus Cafe'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-black/5 pt-2.5 mt-3">
                  {/* Sparks price */}
                  <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${theme.priceBg}`}>
                    <span>{exp.price}</span>
                    <Zap size={8} className="fill-current" />
                  </div>
                  {/* Facepile */}
                  <div className="flex -space-x-1.5">
                    {['Rahul', 'Neha', 'Aarav'].map((name, i) => (
                      <div key={i} className="w-5 h-5 rounded-full overflow-hidden border-2 border-white">
                        <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`} alt={name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LOWER GRID SECTION ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Live Tournaments Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">Live Tournaments</h3>
            <Link href="/gigs" className="text-[10px] font-black text-[#7c3aed] uppercase tracking-wider">
              See all
            </Link>
          </div>

          <div className="space-y-3">
            {/* BGMI Campus Cup */}
            <div className="flex items-center justify-between p-3.5 bg-white border border-zinc-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:border-zinc-200 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center">
                  <Trophy size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-zinc-900 leading-tight">
                    BGMI Campus Cup
                  </h4>
                  <p className="text-[9.5px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                    32 Teams · <span className="text-rose-500 font-extrabold animate-pulse">Live</span>
                  </p>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded-md animate-pulse">
                Live
              </span>
            </div>

            {/* FIFA 24 Showdown */}
            <div className="flex items-center justify-between p-3.5 bg-white border border-zinc-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:border-zinc-200 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center">
                  <Gamepad size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-zinc-900 leading-tight">
                    FIFA 24 Showdown
                  </h4>
                  <p className="text-[9.5px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                    16 Players · Reg. Open
                  </p>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase bg-[#eef2ff] text-[#4f46e5] px-2 py-0.5 rounded-md">
                Open
              </span>
            </div>
          </div>
        </div>

        {/* What's Trending Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">What's Trending</h3>
          </div>

          <div className="space-y-3">
            {[
              { id: 1, title: 'Campus Confessions', posts: '125 posts', bg: 'bg-[#eff6ff]', text: 'text-[#2563eb]', Icon: TrendingUp },
              { id: 2, title: 'Assignment Help', posts: '98 posts', bg: 'bg-[#fff7ed]', text: 'text-[#ea580c]', Icon: HelpCircle },
              { id: 3, title: 'Movie Night', posts: '72 posts', bg: 'bg-[#f0fdf4]', text: 'text-[#16a34a]', Icon: Film }
            ].map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-white border border-transparent hover:border-zinc-100 hover:bg-zinc-50/40 rounded-2xl transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-zinc-400 w-4 text-center">
                    {idx + 1}
                  </span>
                  <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.text} flex items-center justify-center flex-shrink-0`}>
                    <item.Icon size={18} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-900 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[9.5px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                      {item.posts}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── CAMPUS GROUPS SECTION ─────────────────────────── */}
      <div className="space-y-4 pt-8 border-t border-zinc-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Campus Groups & Channels</h3>
            </div>
            <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">Join paid or free campus discussion communities</p>
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-xl self-start sm:self-auto border border-zinc-200/60">
            {['All', 'Free', 'Premium'].map((filter) => (
              <button
                key={filter}
                onClick={() => setGroupFilter(filter)}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  groupFilter === filter
                    ? 'bg-white text-purple-700 shadow-sm font-black'
                    : 'text-zinc-500 hover:text-zinc-900 font-bold'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const hasJoined = joinedGroups[group.name];
            const groupTheme = GROUP_THEME[group.category] || GROUP_THEME.default;
            const GroupIcon = groupTheme.Icon;
            return (
              <div 
                key={group.name}
                className="group relative flex items-center justify-between p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-purple-300 hover:shadow-[0_8px_24px_rgba(124,58,237,0.06)] transition-all duration-200 cursor-pointer"
                onClick={() => handleJoinGroup(group)}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Category Icon Avatar */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                      style={{ background: groupTheme.bg, border: `1px solid ${groupTheme.border}`, color: groupTheme.color }}
                    >
                      <GroupIcon size={20} strokeWidth={2.2} />
                    </div>
                    {group.isOfficial && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <Check size={9} className="text-white" strokeWidth={3.5} />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[13px] font-black text-zinc-950 tracking-tight group-hover:text-purple-700 transition-colors">
                        {group.name}
                      </h4>
                      <span 
                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: groupTheme.bg, color: groupTheme.color, border: `1px solid ${groupTheme.border}` }}
                      >
                        {group.category}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-500 mt-1 leading-snug truncate max-w-[420px]">
                      {group.desc}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      {group.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full">
                          <Zap size={10} className="fill-current text-purple-600" />
                          {group.price} Sparks
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                          Free Group
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400 font-semibold">
                        {group.members + (hasJoined ? 1 : 0)} members
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleJoinGroup(group); }}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-sm ${
                    hasJoined
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : group.isPaid
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/20'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                  }`}
                >
                  {hasJoined ? 'Open Chat' : group.isPaid ? 'Subscribe' : 'Join'}
                </button>
              </div>
            );
          })}
        </div>
      </div>


      {/* ── BOOKING MODAL (PREMIUM AIRBNB STYLE) ───────────────────── */}
      {selectedExp && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-20 sm:pb-4 px-4 pt-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => !bookingLoading && setSelectedExp(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl p-6 anim-scale-in max-h-[80vh] overflow-y-auto"
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
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid #ede9fe' }}>
                    <img src={avatarUrl(mockDb.getUser(selectedExp.hostId))} alt="host" className="w-full h-full object-cover" />
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
          className="fixed inset-0 z-50 flex items-center justify-center pb-20 sm:pb-4 px-4 pt-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <form
            onSubmit={handleSubmitReview}
            className="relative w-full max-w-sm rounded-3xl p-6 space-y-4 anim-scale-in max-h-[80vh] overflow-y-auto"
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
          className="fixed inset-0 z-50 flex items-center justify-center pb-20 sm:pb-4 px-4 pt-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => !isScanningMock && setSelectedActiveBooking(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-[2rem] p-6 space-y-5 anim-scale-in text-center max-h-[80vh] overflow-y-auto"
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
          className="fixed inset-0 z-50 flex items-center justify-center pb-20 sm:pb-4 px-4 pt-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => !createLoading && setShowCreateModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[2rem] p-6 space-y-4 anim-scale-in text-left max-h-[80vh] overflow-y-auto"
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
          className="fixed inset-0 z-50 flex items-center justify-center pb-20 sm:pb-4 px-4 pt-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowBookingsModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-[2.5rem] p-6 space-y-4 anim-scale-in text-left max-h-[80vh] overflow-y-auto"
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
