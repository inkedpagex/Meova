'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Skeleton from '../components/Skeleton';
import {
  Heart, MessageCircle, MessageSquare, Share2, Plus, Sparkles, Zap,
  Camera, X, Loader2, Send, MapPin, Search, ChevronRight,
  Briefcase, Users, ArrowUpRight, ArrowUp, MoreHorizontal, Trash2, Copy,
  ShieldAlert, ShieldCheck, Video
} from '@/lib/icons';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import imageCompression from 'browser-image-compression';
import { useUserContext } from '../components/providers/UserProvider';
import { supabase } from '../lib/supabase/client';
import { toast } from '../lib/toast';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import { optimizeCloudinaryUrl, optimizeAvatarUrl } from '@/utils/imageOptimizer';
import BookCoffeeButton from '@/features/users/BookCoffeeButton';
import StoryCampaignBanner from '../components/StoryCampaignBanner';
import { formatPostDate } from '@/utils/dateFormatter';
import HostBadge from '@/components/HostBadge';
import CustomSelect from '@/components/CustomSelect';
import PostMediaGallery from '@/components/PostMediaGallery';
import MessagePillButton from '@/components/MessagePillButton';

const fetcher = (url) => fetch(url).then((res) => res.json());

const getPostsKey = (pageIndex, previousPageData) => {
  // If reached end
  if (previousPageData && !previousPageData.hasMore) return null;
  // First page
  if (pageIndex === 0) return '/api/posts?limit=12';
  // Keyset cursor pagination
  if (!previousPageData?.nextCursor) return null;
  return `/api/posts?cursor=${encodeURIComponent(previousPageData.nextCursor)}&limit=12`;
};

function FeedSkeleton() {
  return (
    <div className="space-y-5 max-w-[580px] mx-auto select-none animate-in fade-in duration-300">
      <div className="flex gap-4 overflow-hidden py-1 px-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <Skeleton variant="circular" className="w-14 h-14 rounded-full" />
            <Skeleton variant="text" className="w-10 h-3" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-[#E7E5E4] rounded-3xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton variant="text" className="w-24 h-4 mb-1" />
                <Skeleton variant="text" className="w-16 h-3" />
              </div>
            </div>
            <Skeleton variant="rectangular" className="w-full aspect-[4/3] rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Module-level in-memory cache to preserve scroll position across client navigations
let feedScrollPositionCache = 0;

export default function FeedClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, wallet: currentWallet, people, isUserOnline, onlineUsers, onlineCount } = useUserContext();

  // Restore scroll position on back-navigation
  useEffect(() => {
    if (feedScrollPositionCache > 0 && typeof window !== 'undefined') {
      setTimeout(() => {
        window.scrollTo({ top: feedScrollPositionCache, behavior: 'instant' });
      }, 50);
    }
    const onScroll = () => {
      feedScrollPositionCache = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Infinite Keyset Scroll ───────────────────────────────────────
  const {
    data: postsPages,
    error: postsError,
    size,
    setSize,
    isValidating,
    mutate: mutatePosts,
  } = useSWRInfinite(getPostsKey, fetcher, {
    revalidateFirstPage: false,
    revalidateIfStale: false,
    persistSize: true,
    dedupingInterval: 4000,
    revalidateOnFocus: false,
  });

  const campusPosts = useMemo(() => {
    return postsPages ? postsPages.flatMap((page) => page.posts || []) : [];
  }, [postsPages]);

  const displayPosts = campusPosts;
  const dbHydrated = postsPages !== undefined || postsError !== undefined;
  const isReachingEnd = postsPages && (!postsPages[postsPages.length - 1]?.hasMore || postsPages[postsPages.length - 1]?.posts?.length === 0);
  const isLoadingMore = size > 0 && postsPages && typeof postsPages[size - 1] === 'undefined';

  // Realtime new posts incoming pill
  const [newIncomingPostsCount, setNewIncomingPostsCount] = useState(0);

  const [likedPosts, setLikedPosts] = useState({});
  const [animatingHearts, setAnimatingHearts] = useState({});
  const [floatingHearts, setFloatingHearts] = useState({});
  const lastTapRef = useRef({});
  const likingPostIdsRef = useRef(new Set());
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'peers' | 'gigs'
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostPhoto, setSelectedPostPhoto] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Campus Host Moderation State
  const [hostModeratingPost, setHostModeratingPost] = useState(null);
  const [hostDeleteReason, setHostDeleteReason] = useState('Spam / Fake Content');
  const [isHostDeleting, setIsHostDeleting] = useState(false);

  const isHostOrAdmin = currentUser && (
    currentUser.role === 'verified_host' ||
    currentUser.role === 'campus_lead' ||
    currentUser.role === 'admin'
  );

  const handleHostModeratePost = async () => {
    if (!hostModeratingPost) return;
    setIsHostDeleting(true);
    try {
      const res = await fetch('/api/host/moderate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: hostModeratingPost.id,
          action: 'delete',
          reason: hostDeleteReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to moderate post');
      toast.success('Post removed by Host moderation!');
      mutate();
      setHostModeratingPost(null);
    } catch (err) {
      toast.error(err.message || 'Error moderating post');
    } finally {
      setIsHostDeleting(false);
    }
  };

  // Instant 0ms Optimistic Like Handler
  const handleToggleLike = useCallback(async (postId, currentLikedState, forceLike = false) => {
    if (forceLike && currentLikedState) {
      setFloatingHearts((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => setFloatingHearts((prev) => ({ ...prev, [postId]: false })), 800);
      return;
    }

    const nextLiked = forceLike ? true : !currentLikedState;

    // 1. Instant 0ms UI update
    setLikedPosts((prev) => ({ ...prev, [postId]: nextLiked }));
    setAnimatingHearts((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => setAnimatingHearts((prev) => ({ ...prev, [postId]: false })), 350);

    if (forceLike) {
      setFloatingHearts((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => setFloatingHearts((prev) => ({ ...prev, [postId]: false })), 800);
    }

    // 2. Non-blocking background sync
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (!res.ok) {
        setLikedPosts((prev) => ({ ...prev, [postId]: currentLikedState }));
      }
    } catch {
      setLikedPosts((prev) => ({ ...prev, [postId]: currentLikedState }));
    }
  }, []);

  // Sentinel ref for infinite scroll (800px prefetch threshold ~75% depth)
  const observerTarget = useRef(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isValidating && !isLoadingMore) {
          setSize((prev) => prev + 1);
        }
      },
      { rootMargin: '800px 0px 800px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isReachingEnd, isValidating, isLoadingMore, setSize]);

  // Realtime listener for incoming posts (non-intrusive banner)
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('feed-realtime-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          // If the post is by the current user, mutate immediately
          if (payload.new?.user_id === currentUser?.id) {
            mutatePosts();
            return;
          }
          // Otherwise, increment floating pill badge so user's scroll is not interrupted
          setNewIncomingPostsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, mutatePosts]);

  const handleRefreshToTop = () => {
    setNewIncomingPostsCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mutatePosts();
  };

  // Post modal fields (Supports multi-image carousel & videos up to 4 items)
  const [postCaption, setPostCaption] = useState('');
  const [postCategory, setPostCategory] = useState('Showcase');
  const [postLocation, setPostLocation] = useState('Campus');
  const [postMediaList, setPostMediaList] = useState([]);
  const [postUploading, setPostUploading] = useState(false);
  const [postFileUploading, setPostFileUploading] = useState(false);
  const fileInputPostRef = useRef(null);

  useEffect(() => {
    if (searchParams?.get('action') === 'create-post') {
      setShowPostModal(true);
    }
  }, [searchParams]);

  const handlePostFilesSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = 4 - postMediaList.length;
    if (availableSlots <= 0) {
      toast.error('Maximum 4 photos or videos per post');
      return;
    }

    const filesToUpload = selectedFiles.slice(0, availableSlots);
    if (selectedFiles.length > availableSlots) {
      toast.info(`Only adding first ${availableSlots} item(s) (max 4 per post).`);
    }

    try {
      setPostFileUploading(true);
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvqsosbeh';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Meova_unsigned';
      const uploadedUrls = [];

      for (const file of filesToUpload) {
        const isVid = file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|mov)$/i);

        if (isVid && file.size > 25 * 1024 * 1024) {
          toast.error(`Video "${file.name}" exceeds 25MB limit`);
          continue;
        }
        if (!isVid && file.size > 10 * 1024 * 1024) {
          toast.error(`Image "${file.name}" exceeds 10MB limit`);
          continue;
        }

        let fileToUpload = file;
        if (!isVid) {
          try {
            fileToUpload = await imageCompression(file, {
              maxSizeMB: 0.8,
              maxWidthOrHeight: 1280,
              useWebWorker: true,
            });
          } catch {
            fileToUpload = file;
          }
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('upload_preset', uploadPreset);

        const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${isVid ? 'video' : 'image'}/upload`;
        const res = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        } else {
          toast.error(data.error?.message || `Failed to upload ${file.name}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setPostMediaList((prev) => [...prev, ...uploadedUrls].slice(0, 4));
        toast.success(`${uploadedUrls.length} item${uploadedUrls.length > 1 ? 's' : ''} added!`);
      }
    } catch {
      toast.error('Error uploading media');
    } finally {
      setPostFileUploading(false);
      if (fileInputPostRef.current) {
        fileInputPostRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = (indexToRemove) => {
    setPostMediaList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublishPost = async () => {
    if (!postMediaList || postMediaList.length === 0) {
      toast.error('Please upload at least one photo or video');
      return;
    }
    setPostUploading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_urls: postMediaList,
          photoUrl: postMediaList[0],
          caption: postCaption.trim(),
          location: postLocation.trim() || 'Campus',
          category: postCategory || 'Showcase',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to publish post');
        return;
      }
      toast.success('Post shared to campus feed!');
      setShowPostModal(false);
      setPostCaption('');
      setPostMediaList([]);

      // Instantly inject the newly published post into feed cache
      if (data.post) {
        mutatePosts((currentPages) => {
          if (!currentPages || currentPages.length === 0) {
            return [{ posts: [data.post], hasMore: false, nextCursor: null }];
          }
          const firstPage = currentPages[0] || { posts: [] };
          const existingPosts = (firstPage.posts || []).filter(p => p.id !== data.post.id);
          return [
            {
              ...firstPage,
              posts: [data.post, ...existingPosts],
            },
            ...currentPages.slice(1),
          ];
        }, false);
      }
      mutatePosts();
    } catch {
      toast.error('Network error publishing post');
    } finally {
      setPostUploading(false);
    }
  };

  const confirmDeletePost = async () => {
    if (!deletingPostId) return;
    setIsDeletingPost(true);
    try {
      const res = await fetch(`/api/feed/${deletingPostId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to delete post'); return; }
      toast.success('Post deleted successfully');
      setDeletingPostId(null);
      mutatePosts((currentPages) => {
        if (!currentPages) return [];
        return currentPages.map((page) => ({
          ...page,
          posts: (page.posts || []).filter((p) => p.id !== deletingPostId),
        }));
      }, false);
      mutatePosts();
    } catch {
      toast.error('Network error deleting post.');
    } finally {
      setIsDeletingPost(false);
    }
  };

  const campusPeers = useMemo(() => {
    // Collect online users first (excluding current user)
    const currentUid = String(currentUser?.id || currentUser?.uid || '');
    const activeOnline = (onlineUsers || []).filter(u => String(u.user_id) !== currentUid);
    const onlineIdsSet = new Set(activeOnline.map(u => String(u.user_id)));

    // Map active online presence objects to peer structure
    const activePeers = activeOnline.map(ou => ({
      id: ou.user_id,
      full_name: ou.full_name || 'Student',
      username: ou.username || '',
      photo_url: ou.photo_url || '',
      avatar_url: ou.photo_url || '',
      branch: ou.branch || '',
      year: ou.year || '',
      is_online: true,
    }));

    // Other database users who are not currently online
    const otherPeers = (people || [])
      .filter(u => String(u.id) !== currentUid && !onlineIdsSet.has(String(u.id)))
      .map(u => ({ ...u, is_online: isUserOnline(u.id) }));

    // Combined list: Live online peers always first!
    return [...activePeers, ...otherPeers];
  }, [people, currentUser?.id, currentUser?.uid, onlineUsers, isUserOnline]);

  if (!dbHydrated) {
    return <FeedSkeleton />;
  }

  return (
    <div className="max-w-[580px] mx-auto space-y-4 select-none animate-in fade-in duration-300">
      
      {/* ── FLOATING NEW MOMENTS PILL ───────────────────────────── */}
      {newIncomingPostsCount > 0 && (
        <div className="sticky top-20 z-30 flex justify-center pointer-events-none anim-scale-in">
          <button
            type="button"
            onClick={handleRefreshToTop}
            className="pointer-events-auto px-4 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-lg shadow-purple-500/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowUp size={14} strokeWidth={2.5} />
            <span>{newIncomingPostsCount} New Moment{newIncomingPostsCount > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {/* ── LIVE ACTIVE STUDENTS & STORIES ────────── */}
      {campusPeers.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[20px] py-3.5 px-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-[var(--text-primary)] tracking-tight">
                Active Students
              </span>
              {onlineCount > 0 && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {onlineCount} Online
                </span>
              )}
            </div>
            <Link
              href="/discover"
              prefetch={true}
              className="text-[11px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors active:scale-95 flex items-center gap-0.5"
            >
              <span>Explore</span>
              <ChevronRight size={11} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-3 px-3 -mx-2 -my-2 scroll-smooth">
            
            {/* User's Story Button */}
            <div 
              onClick={() => setShowPostModal(true)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group select-none"
            >
              <div className="relative w-[58px] h-[58px] rounded-full p-[2.5px] bg-[var(--accent-tint-20)] group-hover:bg-[var(--accent)] transition-all duration-200 ease-out group-hover:scale-108 group-hover:-translate-y-1 shadow-xs group-hover:shadow-[0_6px_16px_rgba(240,90,0,0.3)] group-active:scale-95">
                <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-surface)] ring-2 ring-[var(--bg-surface)]">
                  <img
                    src={optimizeAvatarUrl(getUserAvatarUrl(currentUser))}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getCartoonAvatar(currentUser?.full_name || 'user');
                    }}
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center ring-2 ring-[var(--bg-surface)] shadow-xs">
                  <Plus size={11} strokeWidth={3} />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate max-w-[62px] text-center">
                You
              </span>
            </div>

            {/* Peer Stories (Live online peers with electric green rings) */}
            {campusPeers.slice(0, 18).map((peer) => {
              const firstName = peer.full_name?.split(' ')[0] || 'Student';
              const isOnline = peer.is_online || isUserOnline(peer.id);

              return (
                <Link
                  key={peer.id}
                  href={`/users/${peer.id}`}
                  prefetch={true}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group select-none"
                >
                  <div className={`relative w-[58px] h-[58px] rounded-full p-[2.5px] transition-all duration-200 ease-out group-hover:scale-108 group-hover:-translate-y-1 shadow-xs group-active:scale-95 ${
                    isOnline
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 group-hover:shadow-[0_6px_16px_rgba(16,185,129,0.45)]'
                      : 'bg-[var(--accent-tint-20)] group-hover:bg-[var(--accent)] group-hover:shadow-[0_6px_16px_rgba(240,90,0,0.3)]'
                  }`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-surface)] p-[1.5px]">
                      <img
                        src={optimizeAvatarUrl(getUserAvatarUrl(peer))}
                        alt=""
                        className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCartoonAvatar(peer.full_name || 'user');
                        }}
                      />
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-surface)] shadow-xs" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate max-w-[62px] text-center">
                    {firstName}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SINGLE SOCIAL POST FEED ────────────────────────── */}
      <div className="space-y-4">
          {displayPosts.length === 0 && !isValidating ? (
            <div className="bg-white rounded-[16px] border border-[#E7E5E4] p-6 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint-10)] text-[var(--accent)] flex items-center justify-center mx-auto">
                <Camera size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1917]">Share the first campus moment</h3>
                <p className="text-xs text-[#78716C] mt-0.5">Post a photo, project, or highlight with students!</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(true)}
                className="px-5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-md shadow-xs active:scale-95 cursor-pointer"
              >
                Share Photo Now
              </button>
            </div>
          ) : (
            <>
              {displayPosts.map((rawPost) => {
                const post = {
                  id: rawPost.id,
                  authorId: rawPost.user_id || rawPost.authorId,
                  authorName: rawPost.author_name || rawPost.authorName || 'Campus Student',
                  authorPhoto: rawPost.author_photo || rawPost.authorPhoto,
                  authorBranch: rawPost.author_branch || rawPost.authorBranch || 'Student',
                  media_urls: Array.isArray(rawPost.media_urls) && rawPost.media_urls.length > 0
                    ? rawPost.media_urls
                    : (rawPost.photoUrl ? [rawPost.photoUrl] : (rawPost.image ? [rawPost.image] : [])),
                  photoUrl: rawPost.media_urls?.[0] || rawPost.photoUrl || rawPost.image || '',
                  caption: (rawPost.content || rawPost.caption || '')
                    .replace(/[📍🏷️][^]*$/gu, '')
                    .replace(/[\u{1F300}-\u{1FAD6}\u{2000}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
                    .trim(),
                  category: rawPost.category || 'Showcase',
                  location: rawPost.location || 'Campus',
                  likes: rawPost.likes_count ?? rawPost.likes ?? 0,
                  timeAgo: formatPostDate(rawPost.created_at),
                };

                const initialLiked = Boolean(rawPost.isLiked);
                const userLikedState = likedPosts[post.id];
                const isLiked = userLikedState !== undefined ? userLikedState : initialLiked;

                let currentLikes = post.likes;
                if (userLikedState !== undefined) {
                  if (userLikedState && !initialLiked) currentLikes = post.likes + 1;
                  else if (!userLikedState && initialLiked) currentLikes = Math.max(0, post.likes - 1);
                }

                const isOwnPost = currentUser && (post.authorId === currentUser.id || post.authorId === currentUser.uid);

                return (
                  <div
                    key={post.id}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 520px' }}
                    className="bg-white border border-[#E7E5E4] rounded-[16px] overflow-hidden shadow-xs transition-all mb-4"
                  >
                    {/* ── Card Header (56px) ───────────────────────────────── */}
                    <div className="flex items-center justify-between px-4 h-14">
                      <div
                        onClick={() => {
                          if (isOwnPost) router.push('/profile');
                          else if (post.authorId) router.push(`/users/${post.authorId}`);
                        }}
                        className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 group/author"
                      >
                        {/* Avatar with online dot */}
                        <div className="relative flex-shrink-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden p-[1px] ring-1 ring-white/10 group-hover/author:ring-[var(--accent)]/50 transition-all bg-white">
                            <img
                              src={optimizeAvatarUrl(post.authorPhoto || getCartoonAvatar(post.authorName))}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getCartoonAvatar(post.authorName);
                              }}
                            />
                          </div>
                          {isUserOnline(post.authorId) && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                        </div>

                        {/* Name + meta */}
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-bold text-[#1C1917] group-hover/author:text-[var(--accent)] transition-colors leading-tight truncate">
                            {post.authorName}
                          </h4>
                          <p className="text-[12px] text-[#78716C] font-medium mt-0.5 flex items-center gap-1.5 leading-none truncate">
                            <span>{post.authorBranch?.split('(')?.[0]?.trim() || 'Student'}</span>
                            <span className="text-[#525252]">·</span>
                            <span>{post.location || 'Campus'}</span>
                            <span className="text-[#525252]">·</span>
                            <span>{post.timeAgo}</span>
                          </p>
                        </div>
                      </div>

                      {/* Header Right Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {!isOwnPost && post.authorId && (
                          <MessagePillButton
                            targetUserId={post.authorId}
                            targetName={post.authorName}
                            currentUserId={currentUser?.id}
                            size="sm"
                          />
                        )}

                        {/* 3-dot menu */}
                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                            className="w-8 h-8 flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {openMenuPostId === post.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={(e) => { e.stopPropagation(); setOpenMenuPostId(null); }}
                              />
                              <div className="absolute right-0 top-full mt-2 w-44 bg-white shadow-xl rounded-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 border border-[#E7E5E4]">
                                {isOwnPost ? (
                                  <button
                                    type="button"
                                    onClick={() => { setOpenMenuPostId(null); setDeletingPostId(post.id); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete post</span>
                                  </button>
                                ) : isHostOrAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => { setOpenMenuPostId(null); setHostModeratingPost(post); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                  >
                                    <ShieldAlert size={14} />
                                    <span>Moderate</span>
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuPostId(null);
                                    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meova.in';
                                    navigator.clipboard.writeText(`${origin}/posts/${post.id}`);
                                    toast.success('Link copied!');
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-[#1C1917] hover:bg-[var(--accent-tint-10)] hover:text-[var(--accent)] rounded-xl transition-colors cursor-pointer"
                                >
                                  <Copy size={14} />
                                  <span>Copy link</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── Photo / Media (Adaptive Zero-Crop Multi-Media Gallery) ── */}
                    {(post.media_urls?.length > 0 || post.photoUrl) && (
                      <div className="px-3.5 pt-0.5 pb-1 relative">
                        <PostMediaGallery
                          mediaUrls={post.media_urls?.length > 0 ? post.media_urls : [post.photoUrl]}
                          onMediaClick={() => {
                            const now = Date.now();
                            const lastTap = lastTapRef.current[post.id] || 0;
                            if (now - lastTap < 300) {
                              handleToggleLike(post.id, isLiked, true);
                              lastTapRef.current[post.id] = 0;
                            } else {
                              lastTapRef.current[post.id] = now;
                            }
                          }}
                        />

                        {/* Category Tag Overlay */}
                        <span className="absolute bottom-3 left-6 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-black/65 text-white backdrop-blur-md tracking-wide pointer-events-none z-20">
                          {post.category || 'Showcase'}
                        </span>

                        {/* Double-tap heart burst */}
                        {floatingHearts[post.id] && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                            <Heart
                              size={84}
                              className="fill-[var(--accent)] text-white drop-shadow-2xl animate-in zoom-in-50 fade-in duration-200"
                              style={{ filter: 'drop-shadow(0 12px 35px rgba(240,90,0,0.8))' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Action Bar (44px) & Caption ────────────────────────── */}
                    <div className="px-4 pt-1 pb-4 space-y-2">
                      <div className="flex items-center justify-between h-10">
                        <div className="flex items-center gap-3">

                          {/* Like */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleLike(post.id, isLiked); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-[#FAFAF8] select-none active:scale-90 transition-all cursor-pointer group/like"
                          >
                            <Heart
                              size={20}
                              className={`transition-all duration-150 ${
                                isLiked
                                  ? 'fill-[var(--accent)] text-[var(--accent)]'
                                  : 'text-[#78716C] group-hover/like:text-[var(--accent)]'
                              } ${animatingHearts[post.id] ? 'scale-125' : 'scale-100'}`}
                            />
                            {currentLikes > 0 && (
                              <span className={`text-[13px] font-bold tabular-nums leading-none ${isLiked ? 'text-[var(--accent)]' : 'text-[#78716C]'}`}>
                                {currentLikes}
                              </span>
                            )}
                          </button>

                          {/* Message with author */}
                          {!isOwnPost && post.authorId && (
                            <MessagePillButton
                              targetUserId={post.authorId}
                              targetName={post.authorName}
                              currentUserId={currentUser?.id}
                              size="md"
                            />
                          )}

                          {/* Share Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meova.in';
                              const postUrl = `${origin}/posts/${post.id}`;
                              if (navigator.share) {
                                navigator.share({
                                  title: `${post.authorName} on Meova`,
                                  text: post.caption || 'Check out this moment on Meova',
                                  url: postUrl,
                                }).catch(() => {});
                              } else {
                                navigator.clipboard.writeText(postUrl);
                                toast.success('Link copied!');
                              }
                            }}
                            className="p-1.5 rounded-full hover:bg-[#FAFAF8] text-[#78716C] hover:text-[var(--accent)] transition-colors cursor-pointer active:scale-90"
                            title="Share"
                          >
                            <Share2 size={19} />
                          </button>
                        </div>
                      </div>

                      {/* Caption */}
                      {post.caption && (
                        <p className="text-[13.5px] text-[#1C1917] leading-relaxed font-normal">
                          <span className="font-bold text-[#1C1917] mr-1.5">{post.authorName}</span>
                          <span>{post.caption}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Infinite Scroll Sentinel */}
              <div ref={observerTarget} className="py-4 flex items-center justify-center">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-xs font-medium text-[#78716C]">
                    <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
                    <span>Loading more moments...</span>
                  </div>
                )}
                {isReachingEnd && displayPosts.length > 0 && (
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E]">
                    You&apos;ve seen all campus moments
                  </p>
                )}
              </div>
            </>
          )}
        </div>



      {/* ── CREATE POST MODAL ──────────────────────────────────── */}
      {showPostModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 anim-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[28px] border border-[#E7E5E4] p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
              <div>
                <h3 className="text-base font-bold text-[#1C1917]">Share Campus Moment</h3>
                <p className="text-[11.5px] text-[#78716C] font-medium">Post up to 4 photos or video clips</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPostModal(false);
                  setPostMediaList([]);
                  setPostCaption('');
                }}
                className="w-8 h-8 rounded-full bg-[#FAFAF8] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center hover:bg-[var(--accent-tint-10)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputPostRef}
              onChange={handlePostFilesSelect}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />

            {/* Media Upload & Preview Area */}
            {postMediaList.length > 0 ? (
              <div className="space-y-2">
                <div className={`grid ${postMediaList.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5`}>
                  {postMediaList.map((url, idx) => {
                    const isVid = url.split('?')[0].toLowerCase().match(/\.(mp4|webm|mov)$/) || url.includes('/video/upload/');
                    return (
                      <div
                        key={idx}
                        className={`relative rounded-2xl overflow-hidden bg-[#0A0A0A]/5 border border-[#E7E5E4] flex items-center justify-center ${
                          postMediaList.length === 1 ? 'h-[240px]' : 'h-[140px]'
                        }`}
                      >
                        {isVid ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                          />
                        ) : (
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}

                        {/* Top badges & remove button */}
                        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                          <span className="px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold">
                            {idx + 1}/{postMediaList.length}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia(idx);
                            }}
                            className="pointer-events-auto w-6 h-6 rounded-full bg-black/80 text-white hover:bg-black flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {isVid && (
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center gap-1">
                            <Video size={10} />
                            <span>Video</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add more files button if < 4 */}
                {postMediaList.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputPostRef.current?.click()}
                    disabled={postFileUploading}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#E7E5E4] hover:border-[var(--accent)] hover:bg-[var(--accent-tint-10)]/30 text-xs font-bold text-[#1C1917] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {postFileUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                        <span>Uploading media...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} strokeWidth={2.5} className="text-[var(--accent)]" />
                        <span>Add more photos/videos ({postMediaList.length}/4)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputPostRef.current?.click()}
                disabled={postFileUploading}
                className="w-full h-[180px] rounded-2xl border-2 border-dashed border-[#E7E5E4] hover:border-[var(--accent)] bg-[#FAFAF8] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                {postFileUploading ? (
                  <div className="flex flex-col items-center gap-1.5 text-[#78716C]">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                    <span className="text-xs font-bold">Uploading media...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                      <Plus size={22} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold text-[#1C1917]">Upload Photos / Videos (Up to 4)</span>
                    <span className="text-[10.5px] font-medium text-[#78716C]">Select up to 4 images (under 10MB) or video (under 25MB)</span>
                  </>
                )}
              </button>
            )}

            {/* Category and Location Selector */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                  Category
                </label>
                <CustomSelect
                  value={postCategory}
                  onChange={setPostCategory}
                  options={['Showcase', 'Campus Life', 'Event / Meetup', 'Memes / Vibes', 'Study / Tech']}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="e.g. Campus, Library, Canteen"
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-[#E7E5E4] text-xs font-semibold text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 shadow-xs"
                />
              </div>
            </div>

            {/* Caption Textarea with Character Counter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                  Caption
                </label>
                <span className="text-[10.5px] font-bold text-[#A8A29E]">
                  {postCaption.length}/1000
                </span>
              </div>
              <textarea
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value.slice(0, 1000))}
                placeholder="What's happening on campus?"
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-white border border-[#E7E5E4] text-xs font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 resize-none shadow-xs"
              />
            </div>

            {/* Publish Button */}
            <button
              type="button"
              onClick={handlePublishPost}
              disabled={postUploading || postFileUploading || postMediaList.length === 0}
              className="w-full py-3.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {postUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Moment...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>
                    Publish Moment {postMediaList.length > 0 ? `(${postMediaList.length} item${postMediaList.length > 1 ? 's' : ''})` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE POST CONFIRMATION MODAL ────────────────────── */}
      {deletingPostId && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md anim-fade-in"
          onClick={() => !isDeletingPost && setDeletingPostId(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl border border-[#E7E5E4] space-y-4 anim-scale-in text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-white">Delete Campus Moment?</h3>
              <button 
                type="button"
                onClick={() => !isDeletingPost && setDeletingPostId(null)}
                className="w-8 h-8 rounded-full bg-white text-[#78716C] hover:text-white flex items-center justify-center hover:bg-[var(--accent-tint-10)] cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#78716C] font-medium leading-relaxed">
              Are you sure you want to delete this moment? This cannot be undone.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeletingPost}
                onClick={() => setDeletingPostId(null)}
                className="flex-1 py-2.5 rounded-full border border-[#E7E5E4] text-white text-xs font-bold uppercase tracking-wider hover:bg-[var(--accent-tint-10)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingPost}
                onClick={confirmDeletePost}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingPost ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HOST MODERATE POST MODAL ───────────────────────── */}
      {hostModeratingPost && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md anim-fade-in"
          onClick={() => !isHostDeleting && setHostModeratingPost(null)}
        >
          <div 
            className="w-full max-w-sm bg-white border border-[#E7E5E4] rounded-[24px] p-6 shadow-2xl space-y-4 anim-scale-in text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <ShieldAlert size={20} />
                <h3 className="text-sm sm:text-base font-bold text-white">Moderate Post (Campus Host)</h3>
              </div>
              <button 
                type="button"
                onClick={() => !isHostDeleting && setHostModeratingPost(null)}
                className="w-8 h-8 rounded-full bg-white text-[#78716C] hover:text-white flex items-center justify-center hover:bg-[var(--accent-tint-10)] cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#78716C] font-medium leading-relaxed">
              Author: <strong className="text-white font-bold">{hostModeratingPost.authorName || 'Student'}</strong>
              <br />
              This will permanently delete this post from the campus feed and record your action in the audit logs.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                Select Reason
              </label>
              <CustomSelect
                value={hostDeleteReason}
                onChange={setHostDeleteReason}
                options={[
                  'Spam / Fake Content',
                  'Inappropriate / Adult Media',
                  'Harassment / Abusive Language',
                  'Misleading / Scam',
                  'Community guideline violation',
                ]}
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={isHostDeleting}
                onClick={() => setHostModeratingPost(null)}
                className="flex-1 py-2.5 rounded-full border border-[#E7E5E4] text-white text-xs font-bold uppercase tracking-wider hover:bg-[var(--accent-tint-10)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isHostDeleting}
                onClick={handleHostModeratePost}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isHostDeleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <span>Delete (Host)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
