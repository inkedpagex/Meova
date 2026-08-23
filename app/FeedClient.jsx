'use client';
// Force compile: 2026-07-16
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Skeleton from '../components/Skeleton';
import {
  Zap, MessageCircle, Heart, Share2, Calendar, MapPin,
  Sparkles, Layers, BookOpen, UserCheck, MessageSquare,
  Send, X, CheckCircle, Loader2, Star, Check, Search,
  ShieldAlert, Clock, AlertTriangle, ShieldCheck, Compass, Users,
  Coffee, Briefcase, Camera, Activity, Music, Bell, ChevronRight,
  SlidersHorizontal, Trophy, Gamepad, TrendingUp, HelpCircle, Film, Plus,
  MoreHorizontal, Bookmark
} from 'lucide-react';
import useSWR from 'swr';
import imageCompression from 'browser-image-compression';
import { useUserContext } from '../components/providers/UserProvider';
// mockDatabase removed — using real Firebase API routes
import confetti from 'canvas-confetti';
import { toast } from '../lib/toast';

const fetcher = (url) => fetch(url).then((res) => res.json());

function FeedSkeleton() {
  return (
    <div className="space-y-6 pb-24 pt-4 px-2 select-none animate-in fade-in duration-300">
      {/* HEADER SECTION SKELETON */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton variant="text" className="h-8 w-32 mb-2" />
          <Skeleton variant="text" className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="h-8 w-16 rounded-full" />
          <Skeleton variant="circular" className="h-10 w-10" />
        </div>
      </div>

      {/* MATCH THE VIBE SKELETON */}
      <div>
        <Skeleton variant="text" className="h-5 w-32 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-[185px] h-[220px] flex-shrink-0 bg-white border border-zinc-100 rounded-[2rem] p-5 flex flex-col items-center">
              <Skeleton variant="circular" className="w-[84px] h-[84px] mb-4" />
              <Skeleton variant="text" className="h-4 w-24 mb-2" />
              <Skeleton variant="text" className="h-3 w-16 mb-4" />
              <Skeleton variant="rectangular" className="h-8 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* CAMPUS EXPERIENCES SKELETON */}
      <div>
        <Skeleton variant="text" className="h-5 w-48 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2].map(i => (
            <div key={i} className="w-[280px] h-[340px] flex-shrink-0 bg-white border border-zinc-100 rounded-3xl p-4 flex flex-col">
              <Skeleton variant="rectangular" className="w-full h-[180px] rounded-2xl mb-4" />
              <Skeleton variant="text" className="h-5 w-40 mb-2" />
              <Skeleton variant="text" className="h-4 w-full mb-2" />
              <div className="mt-auto flex justify-between items-end">
                <Skeleton variant="circular" className="w-8 h-8" />
                <Skeleton variant="rectangular" className="h-8 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CAMPUS GROUPS SKELETON */}
      <div>
        <Skeleton variant="text" className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center p-4 bg-white border border-zinc-200/80 rounded-2xl">
              <Skeleton variant="rectangular" className="w-12 h-12 rounded-xl flex-shrink-0 mr-4" />
              <div className="flex-1">
                <Skeleton variant="text" className="h-4 w-32 mb-2" />
                <Skeleton variant="text" className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import BookCoffeeButton from '@/features/users/BookCoffeeButton';

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
      text: 'text-[#8C3573]',
      muted: 'text-[#9061f9]',
      circleBg: 'bg-[#ede9fe]',
      priceBg: 'bg-[#ede9fe] text-[#8C3573]'
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

// Mock posts removed - using live backend data

export default function FeedClient() {
  const router = useRouter();
  const { user: currentUser, wallet: currentWallet, people } = useUserContext();
  const initialSparks = currentWallet ? (currentWallet.purchased || 0) + (currentWallet.bonus || 0) + (currentWallet.creator || 0) : 0;
  
  // SWR Hooks for data fetching (cached & instantly available)
  const { data: expData, error: expError, mutate: mutateExp } = useSWR('/api/experiences', fetcher);
  const { data: bkData, mutate: mutateBk } = useSWR(currentUser ? '/api/bookings' : null, fetcher);
  const { data: postsData, error: postsError, mutate: mutatePosts } = useSWR('/api/posts', fetcher);
  
  const experiences = expData?.experiences || [];
  const bookings = bkData?.bookings || [];
  const campusPosts = postsData?.posts || [];
  
  // Use real backend posts exclusively
  const displayPosts = campusPosts;
  const dbHydrated = expData !== undefined || expError !== undefined; // True once SWR has data or fails
  
  const [likedPosts, setLikedPosts] = useState({});
  const [userData, setUserData] = useState(currentUser);
  const popularHosts = people?.filter(u => u.id !== currentUser?.id) || [];

  // Low-Balance Alert Modal State
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);

  // Campus Photo Post State
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostPhoto, setSelectedPostPhoto] = useState(null);
  const [postCaption, setPostCaption] = useState('');
  const [postCategory, setPostCategory] = useState('UI/UX Work');
  const [postLocation, setPostLocation] = useState('Innovation Lab');
  const [postFilePreview, setPostFilePreview] = useState('https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80');
  const [postFile, setPostFile] = useState(null); // actual File object for upload
  const [postUploading, setPostUploading] = useState(false);

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
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('16:00');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingConfirmStep, setBookingConfirmStep] = useState(false); // 2-tap confirmation

  // Review Dialog State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewCategories, setReviewCategories] = useState([]);

  // QR & Booking Details Modal
  const [selectedActiveBooking, setSelectedActiveBooking] = useState(null);
  const [isScanningMock, setIsScanningMock] = useState(false);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Redesign Home page active modals and deck states
  const [stackIndex, setStackIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [dismissedVibes, setDismissedVibes] = useState({});

  // Form states for creating experience
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Coffee');
  const [newExpPrice, setNewExpPrice] = useState(100);
  const [newExpDuration, setNewExpDuration] = useState(60);
  const [newExpLocation, setNewExpLocation] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [joinedGroups, setJoinedGroups] = useState(currentUser?.joinedGroups || {});
  const [groupFilter, setGroupFilter] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null); // bookingId being accepted/declined

  const saveJoinedGroups = async (nextJoined) => {
    setJoinedGroups(nextJoined);
    if (currentUser) {
      try {
        await fetch('/api/users/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groups: nextJoined })
        });
      } catch (err) {
        console.error('Failed to sync groups', err);
      }
    }
  };

  const handlePublishPost = async () => {
    if (!postFile) {
      toast.error('Please select or upload a photo!');
      return;
    }
    setPostUploading(true);
    try {
      // 1. Compress image before uploading
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(postFile, options);

      // 2. Upload to Cloudinary using unsigned preset
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqq68y5ep';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'meetuply_unsigned';

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', uploadPreset);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!cloudRes.ok) throw new Error('Cloudinary image upload failed');
      const cloudData = await cloudRes.json();
      const photoUrl = cloudData.secure_url;

      const newPostPayload = {
        photoUrl,
        caption: postCaption || '',
        category: postCategory || 'Campus Work',
        location: postLocation || 'Main Campus'
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostPayload)
      });
      
      if (!res.ok) throw new Error('Failed to create post');
      
      const { post } = await res.json();
      
      // Optimistic update of SWR cache
      mutatePosts({ posts: [post, ...campusPosts] }, false);

      setShowPostModal(false);
      setPostFile(null);
      setPostFilePreview(null);
      setPostCaption('');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      toast.success('Your photo work has been posted to the Campus Feed!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to publish post. Try again.');
    } finally {
      setPostUploading(false);
    }
  };

  const handleFreeNowToggle = async () => {
    if (!currentUser) return;
    const isCurrentlyFree = userData?.isLiveOnCampus;
    const nextState = !isCurrentlyFree;
    
    // Optimistic update
    setUserData(prev => ({ ...prev, isLiveOnCampus: nextState }));
    if (nextState) toast.success("You are now live! Students nearby can see you.");
    else toast.info("You are no longer live on campus.");

    try {
      await fetch('/api/users/free-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFree: nextState, location: 'Campus', durationMinutes: 60 })
      });
      // Optionally trigger revalidation or SWR mutate here
    } catch (e) {
      toast.error("Failed to update status.");
      setUserData(prev => ({ ...prev, isLiveOnCampus: isCurrentlyFree })); // Revert
    }
  };

  const handleJoinGroup = async (group) => {
    if (!currentUser) { router.push('/login'); return; }
    if (joinedGroups[group.name]) {
      router.push(`/messages?user=${encodeURIComponent(group.name)}`);
      return;
    }
    if (group.isPaid) {
      if (sparksBalance < group.price) {
        toast.error(`You need ${group.price} Sparks to join. Balance: ${sparksBalance} Sparks.`);
        router.push('/wallet');
        return;
      }
      // Deduct via server seamlessly
      try {
        await fetch('/api/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sparks: -group.price, pack_name: group.name, pack_key: 'group_join', amount_inr: 0 }),
        });
        setSparksBalance(prev => prev - group.price);
        window.dispatchEvent(new Event('wallet-updated'));
        toast.success(`Joined ${group.name}! ${group.price} Sparks deducted.`);
      } catch (e) {
        console.error('Group join error:', e);
      }
    } else {
      toast.success(`Joined ${group.name}!`);
    }
    saveJoinedGroups({ ...joinedGroups, [group.name]: true });
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => router.push(`/messages?user=${encodeURIComponent(group.name)}`), 400);
  };

  // sparksBalance as state so setSparksBalance works (used in group join deduction)
  const [sparksBalance, setSparksBalance] = useState(
    currentWallet
      ? (currentWallet.purchased || 0) + (currentWallet.bonus || 0) + (currentWallet.creator || 0)
      : initialSparks || 0
  );
  // Keep sparksBalance in sync when wallet updates
  React.useEffect(() => {
    if (currentWallet) {
      setSparksBalance((currentWallet.purchased || 0) + (currentWallet.bonus || 0) + (currentWallet.creator || 0));
    }
  }, [currentWallet]);

  const refreshDbState = async () => {
    await Promise.all([mutateExp(), mutateBk()]);
  };

  const handleConfirmBooking = async () => {
    if (!selectedExp || !currentUser) return;
    if (sparksBalance < selectedExp.price) {
      setShowLowBalanceModal(true);
      return;
    }
    setBookingLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: selectedExp.id,
          title: selectedExp.title,
          price: selectedExp.price,
          duration: selectedExp.duration,
          location: selectedExp.location,
          category: selectedExp.category,
          hostId: selectedExp.hostId,
          hostName: selectedExp.hostName || '',
          date: bookingDate,
          time: bookingTime,
        }),
      });
      if (res.ok) {
        setBookingSuccess(true);
        await refreshDbState();
        window.dispatchEvent(new Event('wallet-updated'));
      } else {
        const d = await res.json();
        alert(d.error || 'Booking failed');
      }
    } catch(e) {
      alert('Network error. Try again.');
    } finally {
      setBookingLoading(false);
    }
  };



  const handleCreateExperience = async () => {
    if (!newExpTitle.trim() || !newExpLocation.trim()) {
      alert('Please fill in all fields!');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newExpTitle,
          category: newExpCategory,
          price: Number(newExpPrice),
          duration: Number(newExpDuration),
          location: newExpLocation,
          days: ['Any'],
          slots: ['Anytime'],
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewExpTitle(''); setNewExpLocation('');
        await refreshDbState();
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to create experience.');
      }
    } catch(e) {
      toast.error('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAcceptRequest = async (bookingId) => {
    if (actionLoadingId) return;
    setActionLoadingId(bookingId + '_accept');
    try {
      const res = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, action: 'accept' }) });
      const data = await res.json();
      if (data.success) toast.success('Booking accepted!');
      else toast.error(data.error || 'Failed to accept.');
    } catch { toast.error('Network error.'); }
    await refreshDbState();
    setActionLoadingId(null);
  };

  const handleDeclineRequest = async (bookingId) => {
    if (actionLoadingId) return;
    setActionLoadingId(bookingId + '_decline');
    try {
      const res = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, action: 'reject' }) });
      const data = await res.json();
      if (data.success) toast.info('Booking declined. Sparks refunded to guest.');
      else toast.error(data.error || 'Failed to decline.');
    } catch { toast.error('Network error.'); }
    await refreshDbState();
    setActionLoadingId(null);
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

    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'complete', code })
      });
      const data = await res.json();
      setVerifyingId(null);

      if (data.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        refreshDbState();
        // Find the completed booking to open the review dialog
        const completedBooking = bookings.find(b => b.id === bookingId);
        if (completedBooking) setReviewBooking(completedBooking);
      } else {
        setVerificationError(prev => ({ ...prev, [bookingId]: data.error || 'Verification failed' }));
      }
    } catch (err) {
      setVerifyingId(null);
      setVerificationError(prev => ({ ...prev, [bookingId]: 'Network error, try again' }));
    }
  };

  // Guest Action: Complete Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;

    // Check who is writing the review
    const isHost = currentUser.id === reviewBooking.hostId;
    const targetUserId = isHost ? reviewBooking.guestId : reviewBooking.hostId;

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reviewBooking.id,
          experienceId: reviewBooking.experienceId,
          targetUserId: targetUserId,
          rating: reviewRating,
          written: reviewText,
          categories: reviewCategories
        })
      });

      // Mark booking as Closed (we update it via API)
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: reviewBooking.id, action: 'close' })
      });

      setReviewBooking(null);
      setReviewText('');
      setReviewCategories([]);
      refreshDbState();
      alert('Thank you for the review!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    }
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
    const matchesSearch =
      (exp.title || '').toLowerCase().includes(query) ||
      (exp.description || '').toLowerCase().includes(query) ||
      (exp.category || '').toLowerCase().includes(query) ||
      (exp.location || '').toLowerCase().includes(query) ||
      (exp.hostName || '').toLowerCase().includes(query) ||
      (exp.tags || []).some(t => t.toLowerCase().includes(query));

    const matchesCategory = activeCategory === 'All' || (exp.category || '').toLowerCase() === activeCategory.toLowerCase();

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
      photo_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav',
      spark_charge: 50
    },
    {
      id: 'priya_p',
      full_name: 'Priya',
      year: '2nd',
      branch: 'BBA',
      college: 'GLA University',
      interests: ['Music', 'Art', 'Travel'],
      photo_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya',
      spark_charge: 50
    }
  ];

  const vibeUsers = popularHosts.length > 0
    ? popularHosts.map(u => ({
        ...u,
        id: u.id,
        full_name: u.full_name,
        year: u.year || '3rd',
        branch: u.branch || 'CSE',
        college: u.college || 'GLA University',
        interests: u.interests?.slice(0, 3) || ['Tech', 'Design', 'Music'],
        photo_url: u.photo_url || u.photoURL || u.photo || avatarUrl(u),
        spark_charge: u.spark_charge || 50
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
    Design:    { bg: '#fdf4ff', color: '#b5609d', border: '#e9d5ff', Icon: Layers },
    Music:     { bg: '#fdf2f8', color: '#ec4899', border: '#fbcfe8', Icon: Music },
    Career:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', Icon: Briefcase },
    Athletics: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', Icon: Activity },
    default:   { bg: '#f5f3ff', color: '#8C3573', border: '#ddd6fe', Icon: Users },
  };

  const filteredGroups = campusGroups.filter(g => {
    if (groupFilter === 'Free') return !g.isPaid;
    if (groupFilter === 'Premium') return g.isPaid;
    return true;
  });

  if (!dbHydrated) {
    return <FeedSkeleton />;
  }

  return (
    <div className="space-y-7 pb-24 px-1 sm:px-2 select-none animate-in fade-in duration-300">

      {/* ── HEADER SECTION ────────────────────────── */}
      <div className="bg-gradient-to-br from-[#fcf6fa]/80 via-white to-[#fcf6fa]/60 border border-[#f5ebf4]/80 rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(99,102,241,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#9e4685] to-[#8C3573] flex-shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                <img 
                  src={getUserAvatarUrl(currentUser)} 
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = getCartoonAvatar(currentUser?.full_name || currentUser?.id || 'user');
                  }}
                />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight truncate">
                  Hi, {userData?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Chirag'} 👋
                </h1>
              </div>
              <p className="text-xs text-zinc-500 font-bold mt-0.5 truncate">
                Who are you meeting on campus today?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live Free Now Toggle Button */}
            <button 
              onClick={handleFreeNowToggle}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 ${
                userData?.isLiveOnCampus 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-emerald-500/20' 
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
              }`}
            >
              {userData?.isLiveOnCampus ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>Live Now</span>
                </>
              ) : (
                <>
                  <MapPin size={13} className="text-[#8C3573]" />
                  <span>Free Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ─────────────────────────── */}
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e4685] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search peers, campus experiences, gigs & groups..."
            className="w-full bg-white border border-zinc-200/90 focus:border-[#9e4685] focus:ring-4 focus:ring-[#9e4685]/10 rounded-2xl pl-11 pr-10 py-3.5 text-xs font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── PEOPLE YOU MIGHT VIBE WITH ─────────────────────────── */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-zinc-950 tracking-tight">People you might vibe with</h3>
            <span className="text-[9.5px] font-black uppercase tracking-wider bg-[#fcf6fa] text-[#74295d] px-2.5 py-0.5 rounded-full border border-[#f5ebf4]">
              Campus Peers
            </span>
          </div>
          <Link href="/discover" className="text-xs font-black text-[#8C3573] hover:text-indigo-850 transition-colors flex items-center gap-0.5">
            <span>See all</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {vibeUsers.filter(u => !dismissedVibes[u.id]).length === 0 ? (
          <div className="text-center py-9 bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs">
            <Users className="w-9 h-9 text-indigo-300 mx-auto mb-2.5" />
            <h4 className="text-xs font-black text-zinc-700">No active campus peers right now</h4>
            <p className="text-[10.5px] text-zinc-400 font-semibold mt-1">Check back later when more students toggle &quot;Free Now&quot;.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pt-1 pb-4 px-4 -mx-4 scroll-smooth">
            {vibeUsers.map((user) => {
              if (dismissedVibes[user.id]) return null;
              return (
                <div
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  className="w-[185px] sm:w-[195px] flex-shrink-0 bg-white border border-[#f5ebf4]/90 rounded-[2.2rem] p-4 flex flex-col items-center justify-between text-center shadow-[0_4px_20px_rgba(140,53,115,0.04)] hover:shadow-[0_12px_32px_rgba(140,53,115,0.14)] hover:border-purple-300 transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative"
                >
                  {/* Avatar with Halo Border & Live Badge */}
                  <div className="relative w-[88px] h-[88px] rounded-full p-[3px] bg-gradient-to-tr from-[#9e4685] via-[#9e4685] to-pink-500 mb-3 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                      <img 
                        src={getUserAvatarUrl(user)} 
                        alt={user.full_name || 'User'} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.src = getCartoonAvatar(user.full_name || user.id || 'user');
                        }}
                      />
                    </div>
                    {/* Live Online Badge */}
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  {/* Name */}
                  <div className="w-full mb-1">
                    <span className="text-xs font-black text-zinc-950 tracking-tight truncate block">
                      {user.full_name}
                    </span>
                    <span className="inline-block text-[9.5px] font-bold text-[#8C3573] bg-[#fcf6fa]/80 px-2.5 py-0.5 rounded-full border border-[#f5ebf4] mt-1 uppercase tracking-wider">
                      {user.year} Yr · {user.branch}
                    </span>
                  </div>

                  <p className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider leading-none mt-1">
                    {user.college}
                  </p>

                  {/* Interest Chips */}
                  <div className="flex flex-wrap gap-1 mt-3 justify-center mb-4">
                    {user.interests.slice(0, 3).map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fcf6fa] text-[#74295d] border border-[#f5ebf4]">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full flex items-center gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedVibes(prev => ({ ...prev, [user.id]: true }));
                      }}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Dismiss"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                    <BookCoffeeButton 
                      targetUserId={user.id}
                      targetName={user.full_name}
                      targetPhoto={avatarUrl(user)}
                      isLoggedIn={!!currentUser}
                      accentColor="#8C3573"
                      renderButton={({ onClick }) => (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            confetti({ particleCount: 80, spread: 55, origin: { y: 0.6 } });
                            onClick(e);
                          }}
                          className="flex-1 h-8 rounded-full bg-gradient-to-r from-[#8C3573] to-[#8C3573] hover:from-[#74295d] hover:to-[#74295d] text-white text-[10.5px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md active:scale-95 shadow-[#9e4685]/20"
                        >
                          <span>Meet {user.spark_charge}</span>
                          <Zap size={11} className="fill-current text-yellow-300" />
                        </button>
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RECENT CAMPUS GIGS & FREELANCE ───────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-zinc-950 tracking-tight">Recent Campus Gigs</h3>
            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              Earn Sparks <Zap size={9} className="fill-current" />
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/gigs?action=post"
              className="text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-[#8C3573] to-[#8C3573] text-white px-3.5 py-1.5 rounded-xl hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 shadow-xs"
            >
              <Plus size={12} strokeWidth={3} />
              <span>Post a Gig</span>
            </Link>
            <Link href="/gigs" className="text-xs font-black text-[#8C3573] hover:text-[#5b21b6] transition-colors flex items-center gap-0.5">
              <span>See all</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 'gig-1',
              title: 'Figma UI Designer for Campus App',
              company: 'Meetuply Team',
              category: 'Design',
              categoryColor: 'bg-[#fcf6fa] text-[#74295d] border-[#f5ebf4]',
              budget: '500',
              duration: '3 Days',
              type: 'FREELANCE',
              desc: 'Looking for a student designer to create sleek dark-mode UI mockups for campus app.'
            },
            {
              id: 'gig-2',
              title: 'Next.js Frontend Bug Fixes',
              company: 'Coding Club',
              category: 'Development',
              categoryColor: 'bg-blue-50 text-blue-700 border-blue-100',
              budget: '750',
              duration: '1 Week',
              type: 'PROJECT',
              desc: 'Help integrate Tailwind CSS components and optimize client page load speed.'
            },
            {
              id: 'gig-3',
              title: 'Campus Fest Poster & Reel Creation',
              company: 'Media Circle',
              category: 'Marketing',
              categoryColor: 'bg-pink-50 text-pink-700 border-pink-100',
              budget: '400',
              duration: '2 Days',
              type: 'CREATIVE',
              desc: 'Create 3 Instagram reels and event posters for the upcoming cultural fest.'
            }
          ].map((gig) => (
            <div 
              key={gig.id}
              onClick={() => router.push('/gigs')}
              className="bg-white border border-zinc-200/80 rounded-3xl p-4.5 flex flex-col justify-between h-full cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${gig.categoryColor}`}>
                    {gig.category}
                  </span>
                  <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1 shadow-2xs">
                    {gig.budget} <Zap size={10} className="fill-current text-amber-500" />
                  </span>
                </div>
                <h4 className="text-xs font-black text-zinc-950 tracking-tight group-hover:text-[#74295d] transition-colors line-clamp-1">
                  {gig.title}
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium line-clamp-2 h-9 leading-relaxed">
                  {gig.desc}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-4 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="w-5 h-5 rounded-full bg-[#f5ebf4] text-[#74295d] font-black text-[9px] flex items-center justify-center border border-[#eac5e0] flex-shrink-0">
                    {gig.company[0]}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 truncate">by {gig.company}</span>
                </div>
                <span className="text-[10px] font-black text-white bg-[#8C3573] group-hover:bg-[#74295d] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-0.5 transition-all shadow-xs flex-shrink-0">
                  Apply <ChevronRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CAMPUS SHOWCASE & WORK FEED (INSTA / TWITTER X STYLE) ───────────────────── */}
      <div className="space-y-4 pt-3">
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-zinc-950 tracking-tight">Campus Feed & Activity</h3>
            <span className="text-[9.5px] font-black uppercase tracking-wider bg-[#fcf6fa] border border-[#eac5e0]/80 text-[#74295d] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              Live Feed <Sparkles size={10} className="text-[#8C3573]" />
            </span>
          </div>

          <button
            onClick={() => setShowPostModal(true)}
            className="text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-[#8C3573] to-[#8C3573] hover:from-[#74295d] hover:to-[#74295d] text-white px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Camera size={13} strokeWidth={2.5} />
            <span>Post Work / Photo</span>
          </button>
        </div>

        {/* Stacked Vertical Post Feed - Signature Meetuply Campus Design */}
        <div className="space-y-6 max-w-xl mx-auto pt-2">
          {displayPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[2rem] border border-zinc-200 border-dashed">
              <Camera className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
              <h3 className="text-sm font-black text-zinc-700">No posts yet</h3>
              <p className="text-xs font-bold text-zinc-500 mt-1">Be the first to share a campus moment!</p>
            </div>
          ) : displayPosts.map((post) => {
            const isLiked = likedPosts[post.id];
            const currentLikes = (post.likes || 0) + (isLiked ? 1 : 0);
            return (
              <div 
                key={post.id}
                className="bg-gradient-to-b from-white via-white to-[#fcf6fa]/20 border border-zinc-200/90 rounded-[2rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(140,53,115,0.08)] hover:border-[#eac5e0] transition-all duration-300 space-y-3.5 group"
              >
                {/* 1. Student Header & Quick Collab CTA */}
                <div className="flex items-center justify-between gap-3">
                  <div 
                    onClick={() => post.authorId && router.push(`/users/${post.authorId}`)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group/author"
                  >
                    <div className="relative flex-shrink-0">
                      <img 
                        src={post.authorPhoto || avatarUrl(post.authorId, post.authorName)} 
                        alt={post.authorName || 'Student'} 
                        className="w-11 h-11 rounded-2xl object-cover border border-[#f5ebf4] shadow-2xs group-hover/author:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = getCartoonAvatar(post.authorName || post.authorId || 'user');
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-zinc-950 group-hover/author:text-[#8C3573] transition-colors truncate">
                          {post.authorName || 'Campus Peer'}
                        </h4>
                        <span className="text-[9.5px] font-black uppercase tracking-wider bg-[#fcf6fa] text-[#74295d] px-2 py-0.5 rounded-md border border-[#f5ebf4]/80 flex-shrink-0">
                          {post.authorBranch || 'CSE'}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 truncate mt-0.5">
                        {post.location || 'Campus'} · {post.timeAgo || 'Recently'}
                      </p>
                    </div>
                  </div>

                  {/* Direct Campus Collab Action */}
                  <button
                    onClick={() => {
                      if (post.authorId) router.push(`/chats?userId=${post.authorId}`);
                      else router.push('/chats');
                    }}
                    className="flex-shrink-0 text-[11px] font-black text-[#74295d] bg-[#fcf6fa] hover:bg-[#8C3573] hover:text-white px-3.5 py-1.5 rounded-full border border-[#eac5e0]/80 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5"
                  >
                    <MessageCircle size={13} />
                    <span>Collab</span>
                  </button>
                </div>

                {/* 2. Framed Portfolio Photo Banner */}
                {post.photoUrl && (
                  <div 
                    onClick={() => setSelectedPostPhoto(post)}
                    className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-950 cursor-pointer group/img shadow-2xs"
                  >
                    <img 
                      src={post.photoUrl} 
                      alt={post.caption || 'Campus Showcase'} 
                      className="w-full h-full object-cover group-hover/img:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-black text-white bg-black/60 backdrop-blur-md px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-2 border border-white/20">
                        <Search size={14} /> Full View
                      </span>
                    </div>
                    
                    {/* Meetuply Category Chip */}
                    <span className="absolute top-3 left-3 text-[10px] font-black text-white bg-[#8C3573]/90 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 shadow-xs flex items-center gap-1">
                      <Sparkles size={10} />
                      <span>{post.category || 'Showcase'}</span>
                    </span>
                  </div>
                )}

                {/* 3. Caption Box */}
                {post.caption && (
                  <div className="pt-0.5">
                    <p className="text-[13px] sm:text-sm text-zinc-800 leading-snug font-medium">
                      {post.caption}
                    </p>
                  </div>
                )}

                {/* 4. Action Dock with Vibe Counter & Quick Share */}
                <div className="pt-2 flex items-center justify-between border-t border-zinc-100/90">
                  <div className="flex items-center gap-3">
                    {/* Dynamic Vibe Button */}
                    <button
                      onClick={() => {
                        const nextLiked = !isLiked;
                        setLikedPosts(prev => ({ ...prev, [post.id]: nextLiked }));
                        
                        // Optimistic SWR Update
                        const updatedPosts = campusPosts.map(p => 
                          p.id === post.id 
                            ? { ...p, likes: currentLikes + (nextLiked ? 1 : -1) } 
                            : p
                        );
                        mutatePosts({ posts: updatedPosts }, false);

                        if (nextLiked) {
                          confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
                          
                          // Actual API Call
                          fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
                            .then(res => res.json())
                            .then(data => {
                               if (data.ok) {
                                  // Update cache with real server count silently
                                  mutatePosts({ posts: campusPosts.map(p => p.id === post.id ? { ...p, likes: data.likes } : p) }, false);
                               }
                            }).catch(console.error);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                        isLiked 
                          ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-105 shadow-xs' 
                          : 'bg-zinc-100/80 text-zinc-600 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                    >
                      <Heart size={15} className={isLiked ? 'fill-current text-rose-600' : ''} />
                      <span>{currentLikes} Vibes</span>
                    </button>

                    {/* Share Button */}
                    <button 
                      onClick={() => {
                        if (typeof window !== 'undefined' && navigator.share) {
                          navigator.share({ title: post.caption || 'Campus Post', url: window.location.href });
                        } else {
                          toast.success('Link copied!');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all cursor-pointer"
                    >
                      <Share2 size={14} />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Bookmark Button */}
                  <button 
                    onClick={() => toast.success('Saved to bookmarks!')}
                    className="text-zinc-400 hover:text-[#8C3573] p-2 rounded-full hover:bg-[#fcf6fa] transition-colors cursor-pointer"
                    title="Save"
                  >
                    <Bookmark size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CAMPUS GROUPS SECTION ─────────────────────────── */}
      <div className="space-y-4 pt-6 border-t border-zinc-200/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8C3573] animate-pulse" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-900">Campus Groups & Channels</h3>
            </div>
            <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">Join campus discussion hubs & exclusive communities</p>
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl self-start sm:self-auto border border-zinc-200/60">
            {['All', 'Free', 'Premium'].map((filter) => (
              <button
                key={filter}
                onClick={() => setGroupFilter(filter)}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  groupFilter === filter
                    ? 'bg-white text-[#74295d] shadow-sm font-black'
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
                className="group relative flex items-center justify-between p-4 sm:p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-purple-300 hover:shadow-[0_8px_24px_rgba(140,53,115,0.08)] transition-all duration-200 cursor-pointer"
                onClick={() => handleJoinGroup(group)}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Category Icon Avatar */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform"
                      style={{ background: groupTheme.bg, border: `1px solid ${groupTheme.border}`, color: groupTheme.color }}
                    >
                      <GroupIcon size={21} strokeWidth={2.2} />
                    </div>
                    {group.isOfficial && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                        <Check size={10} className="text-white" strokeWidth={3.5} />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[13px] sm:text-sm font-black text-zinc-950 tracking-tight group-hover:text-[#74295d] transition-colors">
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
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#74295d] bg-[#fcf6fa] border border-[#eac5e0]/80 px-2.5 py-0.5 rounded-full">
                          <Zap size={10} className="fill-current text-[#8C3573]" />
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
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-xs ${
                    hasJoined
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : group.isPaid
                        ? 'bg-gradient-to-r from-[#8C3573] to-[#8C3573] hover:from-[#74295d] hover:to-[#74295d] text-white shadow-[#9e4685]/20'
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
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-zinc-900/40 backdrop-blur-md p-4 sm:p-0"
          onClick={() => { if (!bookingLoading) { setSelectedExp(null); setBookingConfirmStep(false); } }}
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
                    You have successfully requested <strong className="text-[var(--text-primary)]">{selectedExp.title}</strong>. {selectedExp.price} Sparks have been locked in platform escrow. Check the <strong className="text-[var(--text-primary)]">Active Experience Hub</strong> at the top of the homepage for updates!
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
                {/* Host header: avatar + name + rating */}
                <div className="flex items-center gap-3 mb-5 border-b border-[var(--border-subtle)] pb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid #ede9fe' }}>
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedExp.hostId}`} alt="host" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight truncate">
                      {selectedExp.hostName || 'Host'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {/* Star rating from experience data */}
                      {selectedExp.rating != null && (
                        <span className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10}
                              className={s <= Math.round(selectedExp.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}
                            />
                          ))}
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] ml-1">
                            {Number(selectedExp.rating).toFixed(1)}
                            {selectedExp.reviewsCount > 0 && ` (${selectedExp.reviewsCount})`}
                          </span>
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wide">
                        {selectedExp.category}
                      </span>
                    </div>
                  </div>
                </div>


                <div className="space-y-4 mb-6">
                  {/* Select Slots */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Available Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        // eslint-disable-next-line react-hooks/purity
                        max={new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Time</label>
                      <input
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] rounded-xl p-3 outline-none focus:border-[var(--accent)]"
                      />
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

                {/* Confirm Book CTA — 2-tap protection */}
                {bookingConfirmStep ? (
                  <div className="space-y-2">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center">
                      <p className="text-[11px] font-black text-amber-700">
                        Tap confirm to spend <strong>{selectedExp.price} ⚡</strong> Sparks
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBookingConfirmStep(false)}
                        className="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-xs font-black text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmBooking}
                        disabled={bookingLoading}
                        className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-md"
                      >
                        {bookingLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /><span>Booking...</span></>
                        ) : (
                          <><Zap className="w-4 h-4 fill-current" /><span>Confirm — {selectedExp.price} Sparks</span></>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setBookingConfirmStep(true)}
                    disabled={bookingLoading}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-md"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Spend {selectedExp.price} Sparks &amp; Meet</span>
                  </button>
                )}
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
            noValidate
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
              <label className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-wider block">Written Review (Optional)</label>
              <textarea
                placeholder="Share details of your meetup (keep public, no numbers)..."
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md"
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

                {/* 6-digit Code & QR Display */}
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-wider">Meeting Code (Share at meetup)</p>
                  
                  {/* Guest View: Show actual QR Code */}
                  {selectedActiveBooking.guestId === currentUser.id ? (
                    <div className="bg-white p-3 rounded-2xl shadow-inner border border-[var(--border-subtle)] inline-block">
                      <QRCode value={selectedActiveBooking.meetingCode} size={130} />
                    </div>
                  ) : null}

                  <p className="text-2xl font-black text-white tracking-widest mt-1 bg-[var(--bg-surface)] py-2.5 rounded-xl border border-[var(--border-subtle)] inline-block px-6">
                    {selectedActiveBooking.meetingCode}
                  </p>
                </div>

                {/* Verification Actions */}
                {selectedActiveBooking.hostId === currentUser.id ? (
                  // Host Side Options
                  <div className="space-y-3 pt-1 border-t border-[var(--border-subtle)] text-left">
                    <p className="text-[8.5px] text-[var(--text-muted)] font-black uppercase text-center">Host Controls</p>

                    {/* Actual Scanner Screen for Host */}
                    {isScanningMock ? (
                      <div className="rounded-xl overflow-hidden shadow-md border border-[var(--border-subtle)] h-48 relative">
                        <Scanner 
                          onScan={async (result) => {
                            if (result && result.length > 0) {
                              const scannedCode = result[0].rawValue;
                              setIsScanningMock(false);
                              setVerificationCodes(prev => ({ ...prev, [selectedActiveBooking.id]: scannedCode }));
                              
                              // Auto-verify with the scanned code
                              setVerifyingId(selectedActiveBooking.id);
                              try {
                                const res = await fetch('/api/bookings', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ bookingId: selectedActiveBooking.id, action: 'complete', code: scannedCode })
                                });
                                const data = await res.json();
                                setVerifyingId(null);

                                if (data.success) {
                                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                                  refreshDbState();
                                  const b = bookings.find(bk => bk.id === selectedActiveBooking.id);
                                  setSelectedActiveBooking(null);
                                  if (b) setReviewBooking(b);
                                  toast.success('Meeting verified! Payout released. 🎉');
                                } else {
                                  toast.error(data.error || 'Verification failed. Try manual code entry.');
                                }
                              } catch (err) {
                                setVerifyingId(null);
                                toast.error('Network error. Please try again.');
                              }
                            }
                          }}
                        />
                        <button 
                          onClick={() => setIsScanningMock(false)}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsScanningMock(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <ShieldCheck size={14} />
                        <span>Scan Guest QR Code</span>
                      </button>
                    )}

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
                              toast.warn('Please enter a valid 6-digit code.');
                              return;
                            }
                            setIsScanningMock(true);
                            try {
                              const res = await fetch('/api/bookings', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bookingId: selectedActiveBooking.id, action: 'complete', code })
                              });
                              const data = await res.json();
                              setIsScanningMock(false);

                              if (data.success) {
                                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                                refreshDbState();
                                const b = bookings.find(bk => bk.id === selectedActiveBooking.id);
                                setSelectedActiveBooking(null);
                                if (b) setReviewBooking(b);
                                toast.success('Verified! Payout released. 🎉');
                              } else {
                                toast.error(data.error || 'Verification failed. Check the code and retry.');
                              }
                            } catch (err) {
                              setIsScanningMock(false);
                              toast.error('Network error. Please try again.');
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
                    {[30, 60].map(d => (
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
                          <h5 className="text-[11px] font-bold text-zinc-900 uppercase truncate max-w-[180px]">{b.title}</h5>
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
                          <h5 className="text-[11px] font-bold text-zinc-900 uppercase truncate max-w-[200px]">{b.title}</h5>
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-semibold">
                            Guest: {b.guestName} · {b.date} · {b.time}
                          </p>
                        </div>

                        {b.status === 'Requested' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(b.id)}
                              disabled={!!actionLoadingId}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[9px] font-black uppercase py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              {actionLoadingId === b.id + '_accept' ? <Loader2 size={10} className="animate-spin" /> : null}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(b.id)}
                              disabled={!!actionLoadingId}
                              className="flex-1 bg-rose-950/30 hover:bg-rose-900/40 disabled:opacity-50 border border-rose-800/35 text-rose-400 text-[9px] font-black uppercase py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              {actionLoadingId === b.id + '_decline' ? <Loader2 size={10} className="animate-spin" /> : null}
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

      {/* ── LOW BALANCE ALERT POPOVER ─────────────────────────────── */}
      {showLowBalanceModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowLowBalanceModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200 shadow-2xl border border-[#f5ebf4]"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-[#f5ebf4] border-4 border-[#fcf6fa] flex items-center justify-center mx-auto text-[#8C3573]">
              <Zap size={28} className="fill-[#8C3573] animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">Low Sparks Balance!</h3>
              <p className="text-xs font-semibold text-zinc-500 mt-1.5 leading-relaxed">
                You need <span className="font-extrabold text-[#8C3573]">{selectedExp?.price} Sparks</span> to book <strong className="text-zinc-800">{selectedExp?.title}</strong>. Your current balance is {sparksBalance} Sparks.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLowBalanceModal(false)}
                className="flex-1 py-3 rounded-2xl text-xs font-black text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <Link
                href="/wallet"
                onClick={() => { setShowLowBalanceModal(false); setSelectedExp(null); }}
                className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#8C3573] to-[#8C3573] hover:from-[#74295d] hover:to-[#74295d] shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Zap size={14} className="fill-white" />
                Top Up Sparks
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / POST PHOTO WORK MODAL ───────────────────────── */}
      {showPostModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md anim-fade-in"
          onClick={() => !postUploading && setShowPostModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-zinc-200 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5">
                  <Camera size={16} className="text-[#8C3573]" />
                  Post Work or Campus Photo
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 mt-0.5">Share your design, project, or campus vibe with peers</p>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick Preset Sample Photos */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Choose Sample Photo or Upload</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'UI Mockup', url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80' },
                  { label: 'Coffee Vibe', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80' },
                  { label: 'Coding Lab', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80' },
                  { label: 'Jam Session', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' }
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setPostFilePreview(sample.url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                      postFilePreview === sample.url ? 'border-[#8C3573] ring-2 ring-[#eac5e0] scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={sample.url} alt={sample.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-bold text-white text-center py-0.5 truncate">
                      {sample.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Image URL */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Image URL / Custom Photo</label>
              <input
                type="text"
                placeholder="Paste image link or select preset above..."
                value={postFilePreview}
                onChange={(e) => setPostFilePreview(e.target.value)}
                className="w-full text-xs font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#8C3573] focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            {/* Caption Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Caption</label>
              <textarea
                rows={2}
                placeholder="What are you working on or showcasing today?"
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                className="w-full text-xs font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#8C3573] focus:border-transparent focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Category & Location inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-800 rounded-xl p-2.5 outline-none cursor-pointer"
                >
                  {['UI/UX Work', 'Campus Vibes', 'Project Showcase', 'Campus Event', 'Hackathon', 'Photography'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Innovation Lab"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#8C3573] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePublishPost}
              disabled={postUploading}
              className="w-full py-3 bg-gradient-to-r from-[#8C3573] to-[#8C3573] hover:from-[#74295d] hover:to-[#74295d] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {postUploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Camera size={14} />
                  <span>Publish Photo to Feed</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── FULL SCREEN PHOTO LIGHTBOX MODAL ───────────────── */}
      {selectedPostPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 anim-fade-in"
          onClick={() => setSelectedPostPhoto(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedPostPhoto.authorPhoto || avatarUrl(selectedPostPhoto.authorId, selectedPostPhoto.authorName)} 
                  alt={selectedPostPhoto.authorName || 'Student'} 
                  className="w-9 h-9 rounded-full object-cover border border-[#9e4685]/50"
                  onError={(e) => {
                    e.target.src = getCartoonAvatar(selectedPostPhoto.authorName || selectedPostPhoto.authorId || 'user');
                  }}
                />
                <div>
                  <h4 className="text-xs font-black text-white">{selectedPostPhoto.authorName || 'Campus Peer'}</h4>
                  <p className="text-[10px] text-zinc-400 font-bold">{selectedPostPhoto.authorBranch || 'Student'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPostPhoto(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* High Res Image */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] max-h-[60vh]">
              <img 
                src={selectedPostPhoto.photoUrl} 
                alt={selectedPostPhoto.caption || 'Campus Photo'} 
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>

            {/* Caption & Actions Footer */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-white space-y-3">
              <p className="text-xs font-semibold text-zinc-200 leading-relaxed">
                {selectedPostPhoto.caption}
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-[#b5609d] bg-[#9e4685]/10 px-2.5 py-1 rounded-full border border-[#9e4685]/20 uppercase tracking-wider">
                  {selectedPostPhoto.category || 'Showcase'}
                </span>
                
                <button
                  onClick={() => {
                    const authorId = selectedPostPhoto.authorId;
                    setSelectedPostPhoto(null);
                    if (authorId) {
                      router.push(`/chats?userId=${authorId}`);
                    } else {
                      router.push('/chats');
                    }
                  }}
                  className="px-4 py-2 bg-[#8C3573] hover:bg-[#9e4685] text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle size={14} />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
