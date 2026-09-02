'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Skeleton from '../components/Skeleton';
import {
  Heart, MessageCircle, Share2, Plus, Sparkles, Zap,
  Camera, X, Loader2, Send, MapPin, Search, ChevronRight,
  Briefcase, Users, MessageSquare, ArrowUpRight, ArrowUp
} from 'lucide-react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import imageCompression from 'browser-image-compression';
import { useUserContext } from '../components/providers/UserProvider';
import { supabase } from '../lib/supabase/client';
import confetti from 'canvas-confetti';
import { toast } from '../lib/toast';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import { optimizeCloudinaryUrl, optimizeAvatarUrl } from '@/utils/imageOptimizer';
import BookCoffeeButton from '@/features/users/BookCoffeeButton';

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
          <div key={i} className="bg-white border border-zinc-100 rounded-3xl p-4 space-y-3 shadow-xs">
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
  const { user: currentUser, wallet: currentWallet, people } = useUserContext();

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
    persistSize: true,
    dedupingInterval: 8000,
    revalidateOnFocus: false,
  });

  const { data: gigsData } = useSWR('/api/gigs', fetcher, {
    dedupingInterval: 12000,
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
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'peers' | 'gigs'
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostPhoto, setSelectedPostPhoto] = useState(null);

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
      mutatePosts();
    } catch {
      toast.error('Network error publishing post');
    } finally {
      setPostUploading(false);
    }
  };

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

  if (!dbHydrated) {
    return <FeedSkeleton />;
  }

  const campusPeers = people?.filter(u => u.id !== currentUser?.id) || [];
  const gigs = gigsData?.gigs || [
    {
      id: 'gig-1',
      title: 'UI/UX Designer for Campus App',
      category: 'Design',
      budget: '500',
      duration: '3 Days',
      company: 'Fest Team',
      desc: 'Looking for a student designer to create dark-mode UI mockups for our campus app.'
    },
    {
      id: 'gig-2',
      title: 'Frontend Next.js Optimization',
      category: 'Coding',
      budget: '750',
      duration: '1 Week',
      company: 'Coding Club',
      desc: 'Help integrate Tailwind CSS components and optimize mobile performance.'
    },
    {
      id: 'gig-3',
      title: 'Event Photography & Video Reels',
      category: 'Creative',
      budget: '400',
      duration: '2 Days',
      company: 'Media Circle',
      desc: 'Shoot engaging Instagram reels during the university hackathon.'
    }
  ];

  return (
    <div className="max-w-[580px] mx-auto space-y-4 select-none animate-in fade-in duration-300">
      
      {/* ── FLOATING NEW MOMENTS PILL ───────────────────────────── */}
      {newIncomingPostsCount > 0 && (
        <div className="sticky top-20 z-30 flex justify-center pointer-events-none anim-scale-in">
          <button
            type="button"
            onClick={handleRefreshToTop}
            className="pointer-events-auto px-4 py-2 rounded-full bg-[#F05A00] hover:bg-[#D94F00] text-white text-xs font-black shadow-lg shadow-orange-500/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowUp size={14} strokeWidth={2.5} />
            <span>{newIncomingPostsCount} New Moment{newIncomingPostsCount > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {/* ── 1. CAMPUS STORIES (INSTAGRAM / BEREAL STYLE) ────────── */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-3 shadow-xs">
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 scroll-smooth">
          
          {/* User's Story Button */}
          <div 
            onClick={() => setShowPostModal(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="relative w-14 h-14 rounded-full p-[2px] border-2 border-dashed border-[#F05A00] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100">
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
              <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#F05A00] text-white flex items-center justify-center border-2 border-white shadow-xs">
                <Plus size={10} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10.5px] font-bold text-zinc-700 truncate max-w-[58px]">
              You
            </span>
          </div>

          {/* Peer Stories (Top 15 Active Peers for performance) */}
          {campusPeers.slice(0, 15).map((peer) => {
            const firstName = peer.full_name?.split(' ')[0] || 'Student';
            return (
              <Link
                key={peer.id}
                href={`/users/${peer.id}`}
                prefetch={true}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
              >
                <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#F05A00] via-orange-400 to-amber-400 group-hover:scale-105 transition-transform shadow-2xs">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white p-[1px]">
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
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-2xs" />
                </div>
                <span className="text-[10.5px] font-bold text-zinc-800 truncate max-w-[58px]">
                  {firstName}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 2. QUICK SEGMENT TABS ────────────────────────────────── */}
      <div className="flex items-center gap-2 px-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs ${
            activeTab === 'feed'
              ? 'bg-zinc-950 text-white shadow-md'
              : 'bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50'
          }`}
        >
          Moments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('peers')}
          className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs ${
            activeTab === 'peers'
              ? 'bg-zinc-950 text-white shadow-md'
              : 'bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50'
          }`}
        >
          Active Peers
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gigs')}
          className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs ${
            activeTab === 'gigs'
              ? 'bg-zinc-950 text-white shadow-md'
              : 'bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50'
          }`}
        >
          Gigs
        </button>
      </div>

      {/* ── 3. FEATURED ACTIVE STUDENTS (PEERS TAB) ─────────────── */}
      {activeTab === 'peers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">
              Students on Campus
            </span>
            <Link href="/discover" className="text-xs font-black text-[#F05A00] flex items-center gap-0.5">
              <span>View All</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {campusPeers.slice(0, 20).map((peer) => {
              const cleanYr = (peer.year || '1st').toString().replace(/\s*year\s*/i, '').trim();
              const cleanBranch = (peer.branch || 'CSE').replace(/COMPUTER SCIENCE/i, 'CSE');

              return (
                <Link
                  key={peer.id}
                  href={`/users/${peer.id}`}
                  prefetch={true}
                  className="bg-white border border-zinc-200/80 hover:border-orange-300 rounded-3xl p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="relative w-14 h-14 rounded-full p-[1.5px] bg-gradient-to-tr from-[#F05A00] to-amber-400 mb-2 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                      <img
                        src={optimizeAvatarUrl(getUserAvatarUrl(peer))}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCartoonAvatar(peer.full_name || 'user');
                        }}
                      />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <h4 className="text-xs font-black text-zinc-950 truncate max-w-full group-hover:text-[#F05A00]">
                    {peer.full_name}
                  </h4>
                  <span className="text-[9.5px] font-bold text-[#F05A00] bg-orange-50 px-2 py-0.5 rounded-full mt-0.5 truncate max-w-full">
                    {cleanYr} Yr · {cleanBranch}
                  </span>

                  <div className="w-full mt-3">
                    <BookCoffeeButton
                      targetUserId={peer.id}
                      targetName={peer.full_name}
                      targetPhoto={getUserAvatarUrl(peer)}
                      isLoggedIn={!!currentUser}
                      accentColor="#F05A00"
                      renderButton={({ onClick }) => (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
                            onClick(e);
                          }}
                          className="w-full py-1.5 rounded-xl bg-[#F05A00] text-white text-[10.5px] font-black flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <span>Meet {peer.spark_charge || 25}</span>
                          <Zap size={10} className="fill-current" />
                        </button>
                      )}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. SOCIAL POST FEED (MOMENTS TAB) ────────────────────── */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {displayPosts.length === 0 && !isValidating ? (
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F05A00] flex items-center justify-center mx-auto">
                <Camera size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900">Share the first campus moment</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Post a photo, project, or highlight with students!</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(true)}
                className="px-5 py-2.5 rounded-full bg-[#F05A00] hover:bg-[#D94F00] text-white text-xs font-black shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
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
                  caption: rawPost.content || rawPost.caption || '',
                  category: rawPost.category || 'Showcase',
                  location: rawPost.location || 'Campus',
                  likes: rawPost.likes_count ?? rawPost.likes ?? 0,
                  timeAgo: rawPost.created_at ? new Date(rawPost.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now',
                };

                const isLiked = likedPosts[post.id];
                const currentLikes = post.likes + (isLiked ? 1 : 0);

                return (
                  <div
                    key={post.id}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 520px' }}
                    className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden shadow-xs hover:border-zinc-300 transition-all duration-200"
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between p-3.5 pb-2.5">
                      <div
                        onClick={() => post.authorId && router.push(`/users/${post.authorId}`)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-100 ring-2 ring-[#F05A00]/20 flex-shrink-0">
                          <img
                            src={optimizeAvatarUrl(post.authorPhoto || getCartoonAvatar(post.authorName))}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getCartoonAvatar(post.authorName);
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-zinc-950 group-hover:text-[#F05A00] transition-colors">
                              {post.authorName}
                            </h4>
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-orange-50 text-[#F05A00] border border-orange-100">
                              {post.authorBranch}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-zinc-400">
                            {post.location} · {post.timeAgo}
                          </p>
                        </div>
                      </div>

                      {/* Quick Message CTA */}
                      <button
                        type="button"
                        onClick={() => {
                          if (post.authorId) router.push(`/messages?uid=${post.authorId}`);
                          else router.push('/messages');
                        }}
                        className="text-[11px] font-black text-[#F05A00] hover:text-white bg-orange-50 hover:bg-[#F05A00] border border-orange-200 px-3 py-1 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                      >
                        <MessageCircle size={12} />
                        <span>Message</span>
                      </button>
                    </div>

                    {/* Photo Container */}
                    {post.photoUrl && (
                      <div
                        onClick={() => setSelectedPostPhoto(post)}
                        className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-zinc-950 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={optimizeCloudinaryUrl(post.photoUrl, { width: 900 })}
                          alt=""
                          className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}

                    {/* Actions & Caption */}
                    <div className="p-3.5 pt-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Like Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextLiked = !isLiked;
                              setLikedPosts((prev) => ({ ...prev, [post.id]: nextLiked }));

                              if (nextLiked) {
                                confetti({ particleCount: 40, spread: 50, origin: { y: 0.65 } });
                                fetch(`/api/posts/${post.id}/like`, { method: 'POST' }).catch(() => {});
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                              isLiked
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-rose-50 hover:text-rose-600'
                            }`}
                          >
                            <Heart size={13} className={isLiked ? 'fill-current text-rose-600' : ''} />
                            <span>{currentLikes}</span>
                          </button>

                          {/* Direct Chat */}
                          <button
                            type="button"
                            onClick={() => {
                              if (post.authorId) router.push(`/messages?uid=${post.authorId}`);
                              else router.push('/messages');
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all cursor-pointer"
                          >
                            <MessageSquare size={13} />
                            <span>Chat</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {post.authorId === currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <X size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({ title: post.authorName, text: post.caption, url: window.location.href }).catch(() => {});
                              } else {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Link copied to clipboard');
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                            title="Share"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      </div>

                      {post.caption && (
                        <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                          <span className="font-black text-zinc-950 mr-1.5">{post.authorName}</span>
                          {post.caption}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Infinite Scroll Sentinel */}
              <div ref={observerTarget} className="py-4 flex items-center justify-center">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-xs font-black text-zinc-400">
                    <Loader2 size={16} className="animate-spin text-[#F05A00]" />
                    <span>Loading more moments...</span>
                  </div>
                )}
                {isReachingEnd && displayPosts.length > 0 && (
                  <p className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                    You&apos;ve seen all campus moments
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 5. GIGS DECK (GIGS TAB) ──────────────────────────────── */}
      {activeTab === 'gigs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">
              Earn Sparks on Campus
            </span>
            <Link href="/gigs?action=post" className="text-xs font-black text-[#F05A00] flex items-center gap-0.5">
              <span>Post a Gig</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {gigs.map((gig) => (
            <div
              key={gig.id}
              onClick={() => router.push('/gigs')}
              className="bg-white border border-zinc-200/80 hover:border-orange-300 rounded-3xl p-4.5 shadow-xs transition-all duration-200 cursor-pointer space-y-2.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-[#F05A00] border border-orange-200">
                  {gig.category}
                </span>
                <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  {gig.budget} <Zap size={11} className="fill-current text-amber-500" />
                </span>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-black text-zinc-950 group-hover:text-[#F05A00] transition-colors">
                  {gig.title}
                </h4>
                <p className="text-xs text-zinc-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                  {gig.desc}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
                <span className="text-[11px] font-bold text-zinc-400">
                  by {gig.company} · {gig.duration}
                </span>
                <span className="text-xs font-black text-[#F05A00] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Apply Now <ChevronRight size={12} strokeWidth={3} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE POST MODAL ──────────────────────────────────── */}
      {showPostModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 anim-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-5 shadow-2xl space-y-3.5 relative">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-50 text-[#F05A00] flex items-center justify-center font-black">
                  <Camera size={14} />
                </div>
                <h3 className="text-sm font-black text-zinc-950">Share Campus Moment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
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
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-950">
                <img src={postFilePreview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPostFilePreview('')}
                  className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputPostRef.current?.click()}
                disabled={postFileUploading}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-200 hover:border-[#F05A00] bg-zinc-50/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                {postFileUploading ? (
                  <div className="flex flex-col items-center gap-1.5 text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin text-[#F05A00]" />
                    <span className="text-xs font-bold">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-[#F05A00] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Plus size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black text-zinc-800">Upload Campus Photo</span>
                    <span className="text-[10px] font-semibold text-zinc-400">PNG, JPG up to 10MB</span>
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
                className="w-full p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#F05A00] resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handlePublishPost}
              disabled={postUploading || !postFilePreview}
              className="w-full py-3 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {postUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={13} />}
              <span>Publish Post</span>
            </button>
          </div>
        </div>
      )}

      {/* ── PHOTO FULL SCREEN PREVIEW MODAL ────────────────────── */}
      {selectedPostPhoto && (
        <div
          onClick={() => setSelectedPostPhoto(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 anim-fade-in cursor-pointer"
        >
          <div className="relative max-w-2xl w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={selectedPostPhoto.photoUrl} alt="" className="w-full max-h-[70vh] object-contain bg-black" />
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">{selectedPostPhoto.authorName}</h4>
                <p className="text-xs text-zinc-400">{selectedPostPhoto.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPostPhoto(null)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
