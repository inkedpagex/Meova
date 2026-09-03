'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Skeleton from '../components/Skeleton';
import {
  Heart, MessageCircle, Share2, Plus, Sparkles, Zap,
  Camera, X, Loader2, Send, MapPin, Search, ChevronRight,
  Briefcase, Users, ArrowUpRight, ArrowUp, MoreHorizontal, Trash2, Copy,
  ShieldAlert, ShieldCheck
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

export default function FeedClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, wallet: currentWallet, people, isUserOnline } = useUserContext();

  // ── Infinite Keyset Scroll ───────────────────────────────────────
  const {
    data: postsPages,
    error: postsError,
    size,
    setSize,
    isValidating,
    mutate: mutatePosts,
  } = useSWRInfinite(getPostsKey, fetcher, {
    revalidateFirstPage: true,
    persistSize: true,
    dedupingInterval: 2000,
    revalidateOnFocus: true,
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

  // Sentinel ref for infinite scroll
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
      { rootMargin: '450px' }
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

  // Post modal fields
  const [postCaption, setPostCaption] = useState('');
  const [postCategory, setPostCategory] = useState('Showcase');
  const [postLocation, setPostLocation] = useState('Campus');
  const [postFilePreview, setPostFilePreview] = useState('');
  const [postUploading, setPostUploading] = useState(false);
  const [postFileUploading, setPostFileUploading] = useState(false);
  const fileInputPostRef = useRef(null);

  useEffect(() => {
    if (searchParams?.get('action') === 'create-post') {
      setShowPostModal(true);
    }
  }, [searchParams]);

  const handlePostFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    try {
      setPostFileUploading(true);
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

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
    } catch {
      toast.error('Error uploading photo');
    } finally {
      setPostFileUploading(false);
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
      toast.success('Post shared to campus feed!');
      setShowPostModal(false);
      setPostCaption('');
      setPostFilePreview('');

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
    const list = people?.filter(u => u.id !== currentUser?.id) || [];
    return [...list].sort((a, b) => {
      const aOnline = isUserOnline(a.id) ? 1 : 0;
      const bOnline = isUserOnline(b.id) ? 1 : 0;
      return bOnline - aOnline;
    });
  }, [people, currentUser?.id, isUserOnline]);

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
            className="pointer-events-auto px-4 py-2 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold shadow-lg shadow-purple-500/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowUp size={14} strokeWidth={2.5} />
            <span>{newIncomingPostsCount} New Moment{newIncomingPostsCount > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {/* ── CAMPUS STORIES ────────── */}
      {campusPeers.length > 0 && (
        <div className="bg-white border border-[#E7E5E4] rounded-[16px] py-3 px-4 space-y-2.5 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-[#1C1917] tracking-tight">
                Stories
              </span>
            </div>
            <Link
              href="/discover"
              prefetch={true}
              className="text-[11px] font-bold text-[#6D28D9] hover:text-[#5B21B6] transition-colors active:scale-95 flex items-center gap-0.5"
            >
              <span>Explore</span>
              <ChevronRight size={11} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
            
            {/* User's Story Button */}
            <div 
              onClick={() => setShowPostModal(true)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div className="relative w-[56px] h-[56px] rounded-full p-[2px] bg-[#F3EEFC] group-hover:bg-[#6D28D9] transition-colors">
                <div className="w-full h-full rounded-full overflow-hidden bg-white ring-2 ring-white">
                  <img
                    src={optimizeAvatarUrl(getUserAvatarUrl(currentUser))}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getCartoonAvatar(currentUser?.full_name || 'user');
                    }}
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#6D28D9] text-white flex items-center justify-center ring-2 ring-white shadow-xs">
                  <Plus size={11} strokeWidth={3} />
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#78716C] truncate max-w-[56px] text-center">
                You
              </span>
            </div>

            {/* Peer Stories */}
            {campusPeers.slice(0, 15).map((peer) => {
              const firstName = peer.full_name?.split(' ')[0] || 'Student';
              return (
                <Link
                  key={peer.id}
                  href={`/users/${peer.id}`}
                  prefetch={true}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                >
                  <div className="relative w-[56px] h-[56px] rounded-full p-[2px] bg-[#6D28D9] group-hover:scale-105 transition-transform shadow-xs">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-[1.5px]">
                      <img
                        src={optimizeAvatarUrl(getUserAvatarUrl(peer))}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCartoonAvatar(peer.full_name || 'user');
                        }}
                      />
                    </div>
                    {isUserOnline(peer.id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-[#78716C] truncate max-w-[56px] text-center">
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
            <div className="bg-white rounded-3xl border border-[#E7E5E4]/80 p-6 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#F3EEFC] text-[#6D28D9] flex items-center justify-center mx-auto">
                <Camera size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1917]">Share the first campus moment</h3>
                <p className="text-xs text-[#78716C] mt-0.5">Post a photo, project, or highlight with students!</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(true)}
                className="px-5 py-2.5 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
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
                    className="bg-white border border-[#E7E5E4] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(28,25,23,0.06)] transition-all mb-4"
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
                          <div className="w-9 h-9 rounded-full overflow-hidden p-[1px] ring-1 ring-black/[0.08] group-hover/author:ring-[#6D28D9]/50 transition-all">
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
                          <h4 className="text-[14px] font-semibold text-[#1C1917] group-hover/author:text-[#6D28D9] transition-colors leading-tight truncate">
                            {post.authorName}
                          </h4>
                          <p className="text-[12px] text-[#78716C] font-medium mt-0.5 flex items-center gap-1.5 leading-none truncate">
                            <span>{post.authorBranch?.split('(')?.[0]?.trim() || 'Student'}</span>
                            <span className="text-[#D6D3D1]">·</span>
                            <span>{post.location || 'Campus'}</span>
                            <span className="text-[#D6D3D1]">·</span>
                            <span>{post.timeAgo}</span>
                          </p>
                        </div>
                      </div>

                      {/* 3-dot menu */}
                      <div className="relative flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                          className="w-8 h-8 flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openMenuPostId === post.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuPostId(null); }}
                            />
                            <div className="absolute right-0 top-full mt-2 w-44 bg-white shadow-lg rounded-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 border border-[#E7E5E4]">
                              {isOwnPost ? (
                                <button
                                  type="button"
                                  onClick={() => { setOpenMenuPostId(null); setDeletingPostId(post.id); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete post</span>
                                </button>
                              ) : isHostOrAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => { setOpenMenuPostId(null); setHostModeratingPost(post); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-[#1C1917] hover:bg-[#F3EEFC] hover:text-[#6D28D9] rounded-xl transition-colors cursor-pointer"
                              >
                                <Copy size={14} />
                                <span>Copy link</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Photo (Refined Framed Container with Responsive Max-Height) ── */}
                    {post.photoUrl && (
                      <div className="px-3.5 pt-0.5 pb-1">
                        <div
                          onClick={() => {
                            const now = Date.now();
                            const lastTap = lastTapRef.current[post.id] || 0;
                            if (now - lastTap < 300) {
                              handleToggleLike(post.id, isLiked, true);
                              lastTapRef.current[post.id] = 0;
                            } else {
                              lastTapRef.current[post.id] = now;
                              setTimeout(() => {
                                if (Date.now() - (lastTapRef.current[post.id] || 0) >= 290 && lastTapRef.current[post.id] !== 0) {
                                  setSelectedPostPhoto(post);
                                }
                              }, 300);
                            }
                          }}
                          className="relative w-full max-h-[440px] sm:max-h-[480px] rounded-[14px] overflow-hidden bg-[#FAFAF8] border border-[#E7E5E4]/60 cursor-pointer select-none group/media flex items-center justify-center"
                        >
                          <img
                            src={optimizeCloudinaryUrl(post.photoUrl, { width: 900 })}
                            alt=""
                            className="w-full max-h-[440px] sm:max-h-[480px] object-cover transition-transform duration-300 group-hover/media:scale-[1.01]"
                            loading="lazy"
                            decoding="async"
                          />

                          {/* Category Tag Overlay */}
                          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-black/60 text-white backdrop-blur-xs tracking-wide">
                            {post.category || 'Showcase'}
                          </span>

                          {/* Double-tap heart burst */}
                          {floatingHearts[post.id] && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                              <Heart
                                size={84}
                                className="fill-[#6D28D9] text-white drop-shadow-2xl animate-in zoom-in-50 fade-in duration-200"
                                style={{ filter: 'drop-shadow(0 12px 35px rgba(109,40,217,0.8))' }}
                              />
                            </div>
                          )}
                        </div>
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
                                  ? 'fill-[#6D28D9] text-[#6D28D9]'
                                  : 'text-[#78716C] group-hover/like:text-[#6D28D9]'
                              } ${animatingHearts[post.id] ? 'scale-125' : 'scale-100'}`}
                            />
                            {currentLikes > 0 && (
                              <span className={`text-[13px] font-bold tabular-nums leading-none ${isLiked ? 'text-[#6D28D9]' : 'text-[#78716C]'}`}>
                                {currentLikes}
                              </span>
                            )}
                          </button>

                          {/* Chat / Message with author */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (post.authorId) {
                                router.push(`/messages?userId=${post.authorId}`);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-[#F3EEFC] text-[#78716C] hover:text-[#6D28D9] transition-all cursor-pointer active:scale-90"
                            title="Chat with Author"
                          >
                            <MessageSquare size={19} />
                            <span className="text-[12px] font-bold">Chat</span>
                          </button>

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
                            className="p-1.5 rounded-full hover:bg-[#FAFAF8] text-[#78716C] hover:text-[#6D28D9] transition-colors cursor-pointer active:scale-90"
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
                    <Loader2 size={16} className="animate-spin text-[#6D28D9]" />
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
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 anim-fade-in">
          <div className="w-full max-w-md bg-white rounded-[32px] border border-black/10 p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <h3 className="text-base font-bold text-black">Share Campus Moment</h3>
              <button
                type="button"
                onClick={() => {
                  setShowPostModal(false);
                  setPostFilePreview('');
                  setPostFile(null);
                  setPostCaption('');
                }}
                className="w-8 h-8 rounded-full bg-[#F3EEFC] text-black flex items-center justify-center hover:bg-[#F3EEFC] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputPostRef}
              onChange={handlePostFileSelect}
              accept="image/*"
              className="hidden"
            />

            {postFilePreview ? (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 border border-black/10">
                <img src={postFilePreview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPostFilePreview('')}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputPostRef.current?.click()}
                disabled={postFileUploading}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-black/15 hover:border-[#6D28D9] bg-[#F3EEFC]/20 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                {postFileUploading ? (
                  <div className="flex flex-col items-center gap-1.5 text-black/70">
                    <Loader2 className="w-5 h-5 animate-spin text-[#6D28D9]" />
                    <span className="text-xs font-bold">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-full bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                      <Plus size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold text-black">Upload Campus Photo</span>
                    <span className="text-[10.5px] font-bold text-black/60">PNG, JPG up to 10MB</span>
                  </>
                )}
              </button>
            )}

            <div>
              <textarea
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="What's happening on campus?"
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-white border border-black/10 text-xs font-bold text-black placeholder:text-black/40 focus:outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/10 resize-none shadow-xs"
              />
            </div>

            <button
              type="button"
              onClick={handlePublishPost}
              disabled={postUploading || !postFilePreview}
              className="w-full py-3 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {postUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={14} />}
              <span>Publish Post</span>
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE POST CONFIRMATION MODAL ────────────────────── */}
      {deletingPostId && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in"
          onClick={() => !isDeletingPost && setDeletingPostId(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-black/10 space-y-4 anim-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-black">Delete Campus Moment?</h3>
              <button 
                type="button"
                onClick={() => !isDeletingPost && setDeletingPostId(null)}
                className="w-8 h-8 rounded-full bg-[#F3EEFC] text-black flex items-center justify-center hover:bg-[#F3EEFC] cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Are you sure you want to delete this moment? This cannot be undone.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeletingPost}
                onClick={() => setDeletingPostId(null)}
                className="flex-1 py-2.5 rounded-full border border-black/10 text-black text-xs font-bold uppercase tracking-wider hover:bg-[#F3EEFC] transition-all cursor-pointer"
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in"
          onClick={() => !isHostDeleting && setHostModeratingPost(null)}
        >
          <div 
            className="w-full max-w-sm bg-white border border-black/10 rounded-[32px] p-6 shadow-2xl space-y-4 anim-scale-in text-black"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert size={20} />
                <h3 className="text-sm sm:text-base font-bold text-black">Moderate Post (Campus Host)</h3>
              </div>
              <button 
                type="button"
                onClick={() => !isHostDeleting && setHostModeratingPost(null)}
                className="w-8 h-8 rounded-full bg-[#F3EEFC] text-black flex items-center justify-center hover:bg-[#F3EEFC] cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Author: <strong className="text-black font-bold">{hostModeratingPost.authorName || 'Student'}</strong>
              <br />
              This will permanently delete this post from the campus feed and record your action in the audit logs.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-black uppercase tracking-wider">
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
                className="flex-1 py-2.5 rounded-full border border-black/10 text-black text-xs font-bold uppercase tracking-wider hover:bg-[#F3EEFC] transition-all cursor-pointer"
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
