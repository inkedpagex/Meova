'use client';
// Force compile: 2026-08-25T20:45:00
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Skeleton from '../components/Skeleton';
import {
  Zap, MessageCircle, Heart, Share2, Calendar, MapPin,
  Sparkles, Layers, BookOpen, UserCheck, MessageSquare,
  Send, X, CheckCircle, Loader2, Star, Check, Search,
  ShieldAlert, Clock, AlertTriangle, ShieldCheck, Compass, Users,
  Coffee, Briefcase, Camera, Activity, Music, Bell, ChevronRight,
  SlidersHorizontal, Trophy, Gamepad, TrendingUp, HelpCircle, Film, Plus,
  MoreHorizontal
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
    <div className="space-y-6 pb-4 md:pb-6 px-1 sm:px-2 select-none animate-in fade-in duration-300">
      
      {/* ── HEADER SECTION SKELETON ────────────────────────── */}
      <div className="bg-white border border-zinc-100 rounded-[2rem] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="h-14 w-14 border-2 border-[#F05A00]/20" />
            <div>
              <Skeleton variant="text" className="h-6 w-32 mb-1.5" />
              <Skeleton variant="text" className="h-3 w-48" />
            </div>
          </div>
          <Skeleton variant="rectangular" className="h-8 w-24 rounded-full border border-zinc-200" />
        </div>
      </div>

      {/* ── SEARCH BAR SKELETON ────────────────────────────── */}
      <Skeleton variant="rectangular" className="w-full h-[52px] rounded-2xl border border-zinc-100" />

      {/* ── RECENT CAMPUS GIGS SKELETON ────────────────────── */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" className="h-5 w-40" />
            <Skeleton variant="rectangular" className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton variant="rectangular" className="h-7 w-24 rounded-full" />
            <Skeleton variant="text" className="h-4 w-12" />
          </div>
        </div>

        <div className="flex gap-3.5 overflow-hidden px-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-[260px] sm:w-[280px] flex-shrink-0 bg-white border border-zinc-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs min-h-[148px]">
              <div className="flex items-center justify-between mb-2">
                <Skeleton variant="rectangular" className="h-6 w-20 rounded-lg" />
                <Skeleton variant="rectangular" className="h-6 w-16 rounded-lg" />
              </div>
              <Skeleton variant="text" className="h-4 w-full mb-1" />
              <Skeleton variant="text" className="h-3 w-4/5 mb-3" />
              <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="w-5 h-5" />
                  <Skeleton variant="text" className="h-3 w-20" />
                </div>
                <Skeleton variant="rectangular" className="h-7 w-16 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PEOPLE YOU MIGHT VIBE WITH SKELETON ────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" className="h-5 w-48" />
            <Skeleton variant="rectangular" className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton variant="text" className="h-4 w-12" />
        </div>

        <div className="flex gap-3.5 overflow-hidden px-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-[175px] sm:w-[185px] flex-shrink-0 bg-white border border-zinc-100 rounded-2xl p-4 flex flex-col items-center justify-between shadow-xs">
              <Skeleton variant="circular" className="w-16 h-16 mb-2.5" />
              <Skeleton variant="text" className="h-4 w-24 mb-1" />
              <Skeleton variant="rectangular" className="h-4 w-28 rounded-lg mb-2" />
              
              <div className="flex gap-1 mb-3">
                <Skeleton variant="rectangular" className="h-3 w-12 rounded-md" />
                <Skeleton variant="rectangular" className="h-3 w-14 rounded-md" />
              </div>
              
              <div className="w-full flex items-center gap-1.5 mt-auto pt-1">
                <Skeleton variant="rectangular" className="w-8 h-8 rounded-xl flex-shrink-0" />
                <Skeleton variant="rectangular" className="flex-1 h-8 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4 pt-3 max-w-xl mx-auto">
        <div className="flex items-center justify-between px-1">
          <Skeleton variant="text" className="h-5 w-44" />
          <Skeleton variant="rectangular" className="h-7 w-24 rounded-xl" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
                <div>
                  <Skeleton variant="text" className="h-4 w-28 mb-1" />
                  <Skeleton variant="text" className="h-3 w-36" />
                </div>
              </div>
              <Skeleton variant="rectangular" className="h-7 w-16 rounded-xl" />
            </div>
            <Skeleton variant="rectangular" className="w-full aspect-[4/3] rounded-xl" />
            <Skeleton variant="text" className="h-4 w-3/4" />
          </div>
        ))}
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
      text: 'text-[#F05A00]',
      muted: 'text-[#9061f9]',
      circleBg: 'bg-[#ede9fe]',
      priceBg: 'bg-[#ede9fe] text-[#F05A00]'
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
  const searchParams = useSearchParams();
  const { user: currentUser, wallet: currentWallet, people } = useUserContext();
  const initialSparks = currentWallet ? (currentWallet.purchased || 0) + (currentWallet.bonus || 0) + (currentWallet.creator || 0) : 0;
  
  // SWR Hooks for data fetching (cached & instantly available)
  const { data: bkData, mutate: mutateBk } = useSWR(currentUser ? '/api/bookings' : null, fetcher);
  const { data: postsData, error: postsError, mutate: mutatePosts } = useSWR('/api/posts', fetcher);
  
  const bookings = bkData?.bookings || [];
  const campusPosts = postsData?.posts || [];
  
  // Use real backend posts exclusively
  const displayPosts = campusPosts;
  const dbHydrated = postsData !== undefined || postsError !== undefined; // True once SWR has data or fails
  
  const [likedPosts, setLikedPosts] = useState({});
  const [userData, setUserData] = useState(currentUser);
  const popularHosts = people?.filter(u => u.id !== currentUser?.id) || [];

  // Low-Balance Alert Modal State
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);

  // Campus Photo Post State
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    if (searchParams?.get('action') === 'create-post') {
      setShowPostModal(true);
    }
    const postIdParam = searchParams?.get('post');
    if (postIdParam && displayPosts.length > 0) {
      const target = displayPosts.find(p => p.id === postIdParam);
      if (target) {
        setSelectedPostPhoto({
          id: target.id,
          authorId: target.user_id || target.authorId,
          authorName: target.author_name || target.authorName || 'Campus Peer',
          authorPhoto: target.author_photo || target.authorPhoto,
          authorBranch: target.author_branch || target.authorBranch || 'Student',
          photoUrl: target.media_urls?.[0] || target.photoUrl || target.image || '',
          caption: target.content || target.caption || '',
          category: target.category || 'Showcase',
          location: target.location || 'Campus',
          likes: target.likes_count ?? target.likes ?? 0,
        });
      }
    }
  }, [searchParams, displayPosts]);
  const [selectedPostPhoto, setSelectedPostPhoto] = useState(null);
  const [postCaption, setPostCaption] = useState('');
  const [postCategory, setPostCategory] = useState('UI/UX Work');
  const [postLocation, setPostLocation] = useState('Innovation Lab');
  const [postFilePreview, setPostFilePreview] = useState('');
  const [postUploading, setPostUploading] = useState(false);
  const [postFileUploading, setPostFileUploading] = useState(false);
  const [postUploadStage, setPostUploadStage] = useState('');
  const fileInputPostRef = React.useRef(null);

  const handlePostFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    try {
      setPostFileUploading(true);
      setPostUploadStage('Compressing...');
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      setPostUploadStage('Uploading...');
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvqsosbeh';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Meova_unsigned';

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setPostFilePreview(data.secure_url);
        toast.success('Photo uploaded!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      console.error('[handlePostFileSelect]', err);
      toast.error('Error uploading photo');
    } finally {
      setPostFileUploading(false);
      setPostUploadStage('');
    }
  };

  const handlePublishPost = async () => {
    if (!postFilePreview) {
      toast.error('Please upload a photo first');
      return;
    }
    setPostUploading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: postFilePreview,
          caption: postCaption,
          location: postLocation,
          category: postCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to publish post');
        return;
      }
      toast.success('Post published to campus feed.');
      setShowPostModal(false);
      setPostCaption('');
      setPostFilePreview('');
      mutatePosts();
    } catch (err) {
      console.error('[handlePublishPost]', err);
      toast.error('Network error publishing post');
    } finally {
      setPostUploading(false);
    }
  };

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

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/feed/${postId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to delete post'); return; }
      toast.success('Post deleted successfully');
      mutatePosts();
    } catch {
      toast.error('Network error.');
    }
  };

  // Redesign Home page active modals and deck states
  const [stackIndex, setStackIndex] = useState(0);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [dismissedVibes, setDismissedVibes] = useState({});

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
    Design:    { bg: '#fdf4ff', color: '#D94F00', border: '#e9d5ff', Icon: Layers },
    Music:     { bg: '#fdf2f8', color: '#ec4899', border: '#fbcfe8', Icon: Music },
    Career:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', Icon: Briefcase },
    Athletics: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', Icon: Activity },
    default:   { bg: '#f5f3ff', color: '#F05A00', border: '#ddd6fe', Icon: Users },
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
    <div className="space-y-7 pb-4 md:pb-6 px-0.5 sm:px-2 select-none animate-in fade-in duration-300">

      {/* ── HEADER SECTION ────────────────────────── */}
      <div className="bg-gradient-to-br from-orange-50/60 via-white to-orange-50/40 border border-orange-100/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#F05A00] to-[#F05A00] flex-shrink-0">
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
                  Hi, {userData?.full_name?.split(' ')[0] || currentUser?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Friend'}
                </h1>
              </div>
              <p className="text-xs text-zinc-500 font-bold mt-0.5 truncate whitespace-nowrap">
                Connect on campus today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live Free Now Toggle Button */}
            <button 
              onClick={handleFreeNowToggle}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap ${
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
                  <MapPin size={13} className="text-[#F05A00]" />
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F05A00] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search peers, circles, gigs..."
            className="w-full bg-white border border-zinc-200/90 focus:border-[#F05A00] focus:ring-4 focus:ring-[#F05A00]/10 rounded-2xl pl-11 pr-10 py-3.5 text-xs font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
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

      {/* ── RECENT CAMPUS GIGS & FREELANCE ───────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-zinc-950 tracking-tight whitespace-nowrap">
              Recent Gigs
            </h3>
            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              Earn Sparks <Zap size={9} className="fill-current" />
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/gigs?action=post"
              className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-[#F05A00] to-[#F05A00] text-white px-3 py-1.5 rounded-xl hover:opacity-95 active:scale-95 transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap"
            >
              <Plus size={12} strokeWidth={3} />
              <span>Post Gig</span>
            </Link>
            <Link href="/gigs" className="text-xs font-black text-[#F05A00] hover:text-orange-700 transition-colors flex items-center gap-0.5 whitespace-nowrap">
              <span>See all</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pt-1 pb-3 -mx-4 px-4 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            {
              id: 'gig-1',
              title: 'Figma UI Designer for Campus App',
              company: 'Meetuply Team',
              category: 'Design',
              categoryColor: 'bg-orange-50 text-[#F05A00]',
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
              categoryColor: 'bg-blue-50 text-blue-700',
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
              categoryColor: 'bg-pink-50 text-pink-700',
              budget: '400',
              duration: '2 Days',
              type: 'CREATIVE',
              desc: 'Create 3 Instagram reels and event posters for the upcoming cultural fest.'
            }
          ].map((gig) => (
            <div 
              key={gig.id}
              onClick={() => router.push('/gigs')}
              className="w-[275px] sm:w-[290px] flex-shrink-0 bg-white border border-zinc-200/70 rounded-2xl p-4 flex flex-col justify-between min-h-[152px] cursor-pointer shadow-[0_6px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(240,90,0,0.12)] hover:border-[#F05A00]/40 hover:-translate-y-1 transition-all duration-300 group relative"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${gig.categoryColor}`}>
                    {gig.category}
                  </span>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                    {gig.budget} <Zap size={10} className="fill-current text-amber-500" />
                  </span>
                </div>
                <h4 className="text-xs sm:text-[13px] font-black text-zinc-950 tracking-tight group-hover:text-[#F05A00] transition-colors truncate mt-1">
                  {gig.title}
                </h4>
                <p className="text-[10.5px] text-zinc-500 font-medium line-clamp-2 leading-relaxed">
                  {gig.desc}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 mt-3 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="w-5 h-5 rounded-md bg-orange-50 text-[#F05A00] font-black text-[9px] flex items-center justify-center border border-orange-100 flex-shrink-0">
                    {gig.company[0]}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 truncate">by {gig.company}</span>
                </div>
                <span className="text-[9.5px] font-black text-white bg-[#F05A00] hover:bg-[#D94F00] px-3.5 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-0.5 transition-all shadow-[0_4px_12px_rgba(240,90,0,0.25)] flex-shrink-0">
                  Apply <ChevronRight size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PEOPLE TO VIBE WITH ─────────────────────────── */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-zinc-950 tracking-tight whitespace-nowrap">People to Vibe With</h3>
            <span className="text-[9.5px] font-black uppercase tracking-wider bg-orange-50 text-[#F05A00] px-2.5 py-0.5 rounded-full border border-orange-100 whitespace-nowrap">
              Campus Peers
            </span>
          </div>
          <Link href="/discover" className="text-xs font-black text-[#F05A00] hover:text-orange-700 transition-colors flex items-center gap-0.5 whitespace-nowrap">
            <span>See all</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {vibeUsers.filter(u => !dismissedVibes[u.id]).length === 0 ? (
          <div className="text-center py-9 bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs">
            <Users className="w-9 h-9 text-indigo-300 mx-auto mb-2.5" />
            <h4 className="text-xs font-black text-zinc-700 whitespace-nowrap">No active campus peers right now</h4>
            <p className="text-[10.5px] text-zinc-400 font-semibold mt-1 whitespace-nowrap truncate">Check back later when more students toggle Free Now.</p>
          </div>
        ) : (
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar pt-1 pb-3 -mx-4 px-4 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {vibeUsers.map((user) => {
              if (dismissedVibes[user.id]) return null;
              const cleanYr = (user.year || '1st').toString().replace(/\s*year\s*/i, '').trim();
              const cleanBranch = (user.branch || 'General')
                .replace(/COMPUTER SCIENCE(\s*&\s*ENGINEERING)?/i, 'CSE')
                .replace(/Computer Science.*/i, 'CSE')
                .replace(/BUSINESS ADMIN/i, 'BBA');
              return (
                <div
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  className="w-[175px] sm:w-[185px] flex-shrink-0 bg-white border border-zinc-200/60 rounded-2xl p-4 flex flex-col items-center justify-between text-center shadow-[0_6px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(240,90,0,0.12)] hover:border-[#F05A00]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
                >
                  {/* Avatar with Halo Border & Live Badge */}
                  <div className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#F05A00] to-[#F05A00] mb-2.5 group-hover:scale-105 transition-transform duration-300">
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
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-xs">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  {/* Name & Academic Meta */}
                  <div className="w-full space-y-1 min-w-0">
                    <h4 className="text-xs font-black text-zinc-900 tracking-tight truncate block">
                      {user.full_name}
                    </h4>
                    <span className="inline-block text-[9.5px] font-black text-[#F05A00] bg-orange-50 px-2 py-0.5 rounded-lg truncate max-w-full">
                      {cleanYr} Yr · {cleanBranch}
                    </span>
                    <p className="text-[9.5px] font-bold text-zinc-500 truncate max-w-full mt-0.5">
                      {user.college}
                    </p>
                  </div>

                  {/* Interest Chips (Horizontal, max 2 tags) */}
                  <div className="flex items-center justify-center gap-1 my-2.5 w-full overflow-hidden">
                    {user.interests.slice(0, 2).map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className="text-[8.5px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md bg-zinc-100/80 text-zinc-700 truncate max-w-[80px]">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full flex items-center gap-1.5 mt-auto pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedVibes(prev => ({ ...prev, [user.id]: true }));
                      }}
                      className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Dismiss"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                    <BookCoffeeButton 
                      targetUserId={user.id}
                      targetName={user.full_name}
                      targetPhoto={avatarUrl(user)}
                      isLoggedIn={!!currentUser}
                      accentColor="#F05A00"
                      renderButton={({ onClick }) => (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            confetti({ particleCount: 80, spread: 55, origin: { y: 0.6 } });
                            onClick(e);
                          }}
                          className="flex-1 h-8 rounded-xl bg-[#F05A00] hover:bg-[#D94F00] text-white text-[10.5px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_4px_12px_rgba(240,90,0,0.25)] active:scale-95"
                        >
                          <span>Meet {user.spark_charge}</span>
                          <Zap size={11} className="fill-white text-white flex-shrink-0" />
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

      {/* ── CAMPUS SHOWCASE & WORK FEED (INSTA / TWITTER X STYLE) ───────────────────── */}
      <div className="space-y-4 pt-3">
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-zinc-100 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <h3 className="text-xs sm:text-base font-black text-zinc-950 tracking-tight whitespace-nowrap">
              Campus Feed <span className="hidden sm:inline">& Activity</span>
            </h3>
            <span className="text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider bg-orange-50 border border-orange-100 text-[#F05A00] px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              Live <Sparkles size={9} className="text-[#F05A00]" />
            </span>
          </div>

          <button
            onClick={() => setShowPostModal(true)}
            className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-[#F05A00] to-[#F05A00] hover:opacity-95 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <Camera size={13} strokeWidth={2.5} />
            <span>Post <span className="hidden sm:inline">Photo</span></span>
          </button>
        </div>

        {/* Stacked Vertical Post Feed - Signature Meetuply Campus Design */}
        <div className="space-y-5 max-w-xl mx-auto pt-1">
          {displayPosts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-zinc-200/80 border-dashed p-6 shadow-2xs">
              <Camera className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
              <h3 className="text-xs font-black text-zinc-800">No posts yet</h3>
              <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Be the first to share a campus moment!</p>
            </div>
          ) : displayPosts.map((rawPost) => {
            const post = {
              id: rawPost.id,
              authorId: rawPost.user_id || rawPost.authorId,
              authorName: rawPost.author_name || rawPost.authorName || 'Campus Peer',
              authorPhoto: rawPost.author_photo || rawPost.authorPhoto,
              authorBranch: rawPost.author_branch || rawPost.authorBranch || 'Student',
              photoUrl: rawPost.media_urls?.[0] || rawPost.photoUrl || rawPost.image || '',
              caption: rawPost.content || rawPost.caption || '',
              category: rawPost.category || 'Showcase',
              location: rawPost.location || 'Campus',
              likes: rawPost.likes_count ?? rawPost.likes ?? 0,
              timeAgo: rawPost.created_at ? new Date(rawPost.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
            };

            const isLiked = likedPosts[post.id];
            const currentLikes = post.likes + (isLiked ? 1 : 0);
            return (
              <div 
                key={post.id}
                className="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-orange-200 transition-all duration-200 space-y-3.5 group"
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
                        className="w-10 h-10 rounded-xl object-cover border border-orange-100 shadow-2xs group-hover/author:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = getCartoonAvatar(post.authorName || post.authorId || 'user');
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-black text-zinc-950 group-hover:text-[#F05A00] transition-colors truncate">
                          {post.authorName}
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-orange-50 text-[#F05A00] px-2 py-0.5 rounded-md border border-orange-100 flex-shrink-0">
                          {post.authorBranch}
                        </span>
                      </div>
                      <p className="text-[10.5px] font-semibold text-zinc-400 truncate mt-0.5">
                        {post.location} · {post.timeAgo}
                      </p>
                    </div>
                  </div>

                  {/* Direct Campus Collab Action */}
                  <button
                    onClick={() => {
                      if (post.authorId) router.push(`/chats?userId=${post.authorId}`);
                      else router.push('/chats');
                    }}
                    className="flex-shrink-0 text-[10.5px] font-black text-[#F05A00] bg-orange-50 hover:bg-gradient-to-r hover:from-[#F05A00] hover:to-[#F05A00] hover:text-white px-3 py-1.5 rounded-xl border border-orange-100 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5"
                  >
                    <MessageCircle size={13} />
                    <span>Collab</span>
                  </button>
                </div>

                {/* 2. Framed Portfolio Photo Banner */}
                {post.photoUrl && (
                  <div 
                    onClick={() => setSelectedPostPhoto(post)}
                    className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden bg-zinc-950 cursor-pointer group/img shadow-2xs"
                  >
                    <img 
                      src={post.photoUrl} 
                      alt={post.caption || 'Campus Showcase'} 
                      className="w-full h-full object-cover group-hover/img:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-black text-white bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 border border-white/20">
                        <Search size={14} /> Full View
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Caption Box */}
                {post.caption && (
                  <div className="pt-0.5">
                    <p className="text-[13px] sm:text-sm text-zinc-800 leading-snug font-medium whitespace-pre-line">
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
                            ? { ...p, likes_count: currentLikes + (nextLiked ? 1 : -1) } 
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

                    {/* Delete Button */}
                    {post.authorId === currentUser?.id && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <X size={15} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}

                    {/* Share Button */}
                    <button 
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const postUrl = `${window.location.origin}/?post=${post.id}`;
                          if (navigator.share) {
                            navigator.share({
                              title: `${post.authorName} on Meova`,
                              text: post.caption ? `"${post.caption.slice(0, 80)}..."` : 'Check out this post on Meova!',
                              url: postUrl
                            }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(postUrl);
                            toast.success('Post link copied to clipboard!');
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all cursor-pointer"
                    >
                      <Share2 size={14} />
                      <span>Share</span>
                    </button>
                  </div>
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
              <span className="w-2 h-2 rounded-full bg-[#F05A00] animate-pulse" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-900 whitespace-nowrap">Campus Groups</h3>
            </div>
            <p className="text-[11px] text-zinc-500 font-semibold mt-0.5 whitespace-nowrap truncate">Join campus discussion hubs</p>
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl self-start sm:self-auto border border-zinc-200/60">
            {['All', 'Free', 'Premium'].map((filter) => (
              <button
                key={filter}
                onClick={() => setGroupFilter(filter)}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  groupFilter === filter
                    ? 'bg-white text-[#F05A00] shadow-sm font-black'
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
                className="group relative flex items-center justify-between p-3 sm:p-3.5 bg-white border border-zinc-200/80 rounded-2xl shadow-xs hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[82px]"
                onClick={() => handleJoinGroup(group)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Category Icon Avatar */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform"
                      style={{ background: groupTheme.bg, border: `1px solid ${groupTheme.border}`, color: groupTheme.color }}
                    >
                      <GroupIcon size={18} strokeWidth={2.2} />
                    </div>
                    {group.isOfficial && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                        <Check size={8} className="text-white" strokeWidth={3.5} />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="text-xs sm:text-[13px] font-black text-zinc-950 tracking-tight group-hover:text-[#F05A00] transition-colors truncate">
                        {group.name}
                      </h4>
                      <span 
                        className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ background: groupTheme.bg, color: groupTheme.color, border: `1px solid ${groupTheme.border}` }}
                      >
                        {group.category}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-medium text-zinc-500 mt-0.5 leading-tight truncate">
                      {group.desc}
                    </p>
                    
                    <div className="flex items-center gap-2.5 mt-1.5">
                      {group.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-[#F05A00] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md flex-shrink-0">
                          <Zap size={9} className="fill-current text-[#F05A00]" />
                          {group.price} Sparks
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex-shrink-0">
                          Free Group
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 font-semibold truncate">
                        {group.members + (hasJoined ? 1 : 0)} members
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleJoinGroup(group); }}
                  className={`flex-shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${
                    hasJoined
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-orange-50 text-[#F05A00] hover:bg-[#F05A00] hover:text-white border border-orange-200/90 shadow-2xs'
                  }`}
                >
                  {hasJoined ? 'Open' : 'Join'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── YOU'RE ALL CAUGHT UP SECTION ────────────────────── */}
      <div className="py-8 text-center space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-orange-50/80 border border-orange-100 text-[#F05A00] flex items-center justify-center mx-auto">
          <CheckCircle size={20} className="text-[#F05A00]" />
        </div>
        <h3 className="text-sm font-black text-zinc-900 tracking-tight">
          You&apos;re All Caught Up!
        </h3>
        <p className="text-[11px] font-semibold text-zinc-500 max-w-xs mx-auto leading-relaxed">
          Check back later for more updates and exciting opportunities.
        </p>
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
                    You have successfully requested <strong className="text-[var(--text-primary)]">{selectedExp.title}</strong>. {selectedExp.price} Sparks have been locked in platform escrow. Check the <strong className="text-[var(--text-primary)]">Active Meetups Hub</strong> at the top of the homepage for updates!
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
                How was your campus meetup with {currentUser.id === reviewBooking.hostId ? reviewBooking.guestName : reviewBooking.hostName}?
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
                                  toast.success('Meeting verified! Payout released.');
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
                                toast.success('Verified! Payout released.');
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
            <div className="w-16 h-16 rounded-full bg-[#f5ebf4] border-4 border-[#fcf6fa] flex items-center justify-center mx-auto text-[#F05A00]">
              <Zap size={28} className="fill-[#F05A00] animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">Low Sparks Balance!</h3>
              <p className="text-xs font-semibold text-zinc-500 mt-1.5 leading-relaxed">
                You need <span className="font-extrabold text-[#F05A00]">{selectedExp?.price} Sparks</span> to book <strong className="text-zinc-800">{selectedExp?.title}</strong>. Your current balance is {sparksBalance} Sparks.
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
                className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#F05A00] to-[#F05A00] hover:from-[#D94F00] hover:to-[#D94F00] shadow-sm transition-all flex items-center justify-center gap-1.5"
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
                  <Camera size={16} className="text-[#F05A00]" />
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

            {/* Direct Photo Upload */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Upload Photo</label>
              
              <input
                ref={fileInputPostRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handlePostFileSelect}
                className="hidden"
              />

              {postFilePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 group">
                  <img src={postFilePreview} alt="Upload preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputPostRef.current?.click()}
                      disabled={postFileUploading}
                      className="px-3 py-1.5 bg-white text-zinc-900 rounded-xl text-xs font-black shadow-md hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostFilePreview('')}
                      className="p-1.5 bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-600 transition-all cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputPostRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    postFileUploading 
                      ? 'border-orange-300 bg-orange-50/50' 
                      : 'border-zinc-200 hover:border-[#F05A00] hover:bg-orange-50/30'
                  }`}
                >
                  {postFileUploading ? (
                    <div className="space-y-1.5">
                      <Loader2 size={24} className="animate-spin text-[#F05A00] mx-auto" />
                      <p className="text-xs font-black text-zinc-700">{postUploadStage || 'Processing...'}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 text-[#F05A00] flex items-center justify-center">
                        <Camera size={20} strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-900">Choose from gallery or camera</p>
                        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Caption</label>
              <textarea
                rows={2}
                placeholder="What are you working on or showcasing today?"
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                className="w-full text-xs font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#F05A00] focus:border-transparent focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Category & Location inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-800 rounded-xl p-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-[#F05A00] focus:border-transparent transition-all"
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
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#F05A00] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePublishPost}
              disabled={postUploading}
              className="w-full py-3 bg-gradient-to-r from-[#F05A00] to-[#F05A00] hover:from-[#D94F00] hover:to-[#D94F00] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
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
                <span className="text-[10px] font-bold text-[#D94F00] bg-[#9e4685]/10 px-2.5 py-1 rounded-full border border-[#9e4685]/20 uppercase tracking-wider">
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
                  className="px-4 py-2 bg-[#F05A00] hover:bg-[#9e4685] text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
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
