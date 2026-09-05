'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera, Heart, Share2, MessageCircle, X, ChevronLeft, ChevronRight,
  ExternalLink, Trash2, Loader2, Sparkles, Check
} from '@/lib/icons';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import { toast } from '@/lib/toast';

function timeAgo(isoString) {
  if (!isoString) return '';
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  } catch {
    return '';
  }
}

export default function CampusMomentsGallery({
  posts = [],
  currentUserId = null,
  author = null,
  canDelete = false,
  onDeletePost = null,
}) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [likesMap, setLikesMap] = useState({});
  const [likedStateMap, setLikedStateMap] = useState({});
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const lastTapRef = useRef(0);

  // Initialize likes map
  useEffect(() => {
    const lMap = {};
    posts.forEach((p) => {
      lMap[p.id] = p.likes_count || 0;
    });
    setLikesMap(lMap);
  }, [posts]);

  const activePost = selectedIndex !== null ? posts[selectedIndex] : null;

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : posts.length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedIndex, posts.length]);

  const handleToggleLike = useCallback(
    async (post, forceLike = false) => {
      if (!post) return;
      const currentIsLiked = likedStateMap[post.id] || false;
      if (forceLike && currentIsLiked) {
        setShowFloatingHeart(true);
        setTimeout(() => setShowFloatingHeart(false), 800);
        return;
      }

      const nextLiked = forceLike ? true : !currentIsLiked;
      const currentCount = likesMap[post.id] ?? (post.likes_count || 0);
      const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

      // Optimistic state
      setLikedStateMap((prev) => ({ ...prev, [post.id]: nextLiked }));
      setLikesMap((prev) => ({ ...prev, [post.id]: nextCount }));

      if (forceLike) {
        setShowFloatingHeart(true);
        setTimeout(() => setShowFloatingHeart(false), 800);
      }

      try {
        const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
        if (!res.ok) {
          // Revert
          setLikedStateMap((prev) => ({ ...prev, [post.id]: currentIsLiked }));
          setLikesMap((prev) => ({ ...prev, [post.id]: currentCount }));
        }
      } catch {
        setLikedStateMap((prev) => ({ ...prev, [post.id]: currentIsLiked }));
        setLikesMap((prev) => ({ ...prev, [post.id]: currentCount }));
      }
    },
    [likedStateMap, likesMap]
  );

  const handleDoubleTap = (post) => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      handleToggleLike(post, true);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleShare = (post) => {
    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : '';
    if (navigator.share) {
      navigator
        .share({
          title: `${post.author_name || author?.full_name || 'Campus Student'} on Meova`,
          text: post.content || 'Check out this campus moment on Meova',
          url: postUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      setCopiedLink(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDelete = async (postId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this campus moment?')) return;
    setDeletingId(postId);
    try {
      if (onDeletePost) {
        await onDeletePost(postId);
      } else {
        const res = await fetch(`/api/posts?id=${postId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete post');
        toast.success('Moment deleted');
        router.refresh();
      }
      if (selectedIndex !== null) setSelectedIndex(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting moment');
    } finally {
      setDeletingId(null);
    }
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8 rounded-[16px] bg-[#FAFAF8] border border-dashed border-[#E7E5E4]">
        <Camera className="w-6 h-6 text-[#A8A29E] mx-auto mb-2" />
        <p className="text-xs font-bold text-[#78716C]">No moments shared yet</p>
        <p className="text-[10px] text-[#A8A29E] mt-0.5">Moments posted on the campus feed will appear here</p>
      </div>
    );
  }

  const postAuthor = author || (activePost ? {
    full_name: activePost.author_name || 'Campus Student',
    avatar_url: activePost.author_avatar || activePost.author_photo,
    id: activePost.user_id,
    branch: activePost.author_branch,
  } : null);

  const activeAvatar = postAuthor ? getUserAvatarUrl(postAuthor) || getCartoonAvatar(postAuthor.full_name || 'User') : getCartoonAvatar('Meova');

  return (
    <>
      {/* ── Moments Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {posts.map((post, idx) => {
          const hasImage = post.media_urls && post.media_urls.length > 0;
          const firstImg = hasImage ? post.media_urls[0] : null;
          const currentCount = likesMap[post.id] ?? (post.likes_count || 0);

          return (
            <div
              key={post.id}
              onClick={() => setSelectedIndex(idx)}
              className="group relative rounded-[16px] overflow-hidden border border-[#E7E5E4] bg-[#FAFAF8] flex flex-col justify-between aspect-square transition-all duration-200 hover:shadow-[0_4px_16px_rgba(28,25,23,0.12)] hover:border-[var(--accent)] cursor-pointer select-none active:scale-[0.98]"
            >
              {hasImage ? (
                <>
                  <img
                    src={firstImg}
                    alt="Campus Moment"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="p-3.5 flex-1 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-[#1C1917] line-clamp-4 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Optional Delete Button */}
              {canDelete && (
                <div className="relative z-10 p-2 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(post.id, e)}
                    disabled={deletingId === post.id}
                    className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-[#78716C] hover:text-rose-600 hover:bg-white shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title="Delete Moment"
                  >
                    {deletingId === post.id ? (
                      <Loader2 size={12} className="animate-spin text-rose-500" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              )}

              {/* Bottom Info Bar */}
              <div className="relative z-10 p-2.5 mt-auto flex items-center justify-between text-[10px] font-bold text-white">
                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                  <Heart size={10} className="fill-rose-500 text-rose-500" />
                  <span>{currentCount}</span>
                </span>
                <span className="text-[9px] opacity-80 font-medium">
                  {timeAgo(post.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Instagram-Style Post Viewer Lightbox Modal ── */}
      {activePost && (
        <div
          onClick={() => setSelectedIndex(null)}
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 anim-fade-in cursor-pointer"
        >
          {/* Previous Arrow */}
          {posts.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : posts.length - 1));
              }}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-[100000] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Next Arrow */}
          {posts.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
              }}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-[100000] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer"
              title="Next (Right Arrow)"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Modal Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[860px] bg-white rounded-none sm:rounded-[28px] overflow-hidden flex flex-col sm:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#E7E5E4] cursor-default relative"
          >
            {/* Top Close Button on Mobile */}
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="sm:hidden absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md cursor-pointer active:scale-90"
            >
              <X size={18} />
            </button>

            {/* Left Media Area */}
            <div
              onClick={() => handleDoubleTap(activePost)}
              className="relative bg-black flex-1 min-h-[280px] sm:min-h-[460px] max-h-[50vh] sm:max-h-[85vh] flex items-center justify-center select-none overflow-hidden"
            >
              {activePost.media_urls && activePost.media_urls.length > 0 ? (
                <img
                  src={activePost.media_urls[0]}
                  alt="Campus Moment"
                  className="w-full h-full object-contain max-h-[50vh] sm:max-h-[85vh]"
                />
              ) : (
                <div className="p-8 text-center text-white max-w-sm">
                  <p className="text-base font-medium leading-relaxed">
                    {activePost.content}
                  </p>
                </div>
              )}

              {/* Double-tap Floating Heart Animation */}
              {showFloatingHeart && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart size={90} className="fill-white text-white drop-shadow-2xl animate-ping" />
                </div>
              )}
            </div>

            {/* Right Details Column */}
            <div className="w-full sm:w-[360px] flex flex-col justify-between bg-white text-[#1C1917] p-4 sm:p-5 flex-shrink-0">
              {/* Author Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E7E5E4]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Link
                    href={`/users/${activePost.user_id || author?.id}`}
                    className="w-9 h-9 rounded-full overflow-hidden border border-[#E7E5E4] flex-shrink-0 hover:scale-105 transition-transform"
                  >
                    <img
                      src={activeAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/users/${activePost.user_id || author?.id}`}
                      className="text-xs font-bold text-[#1C1917] hover:text-[var(--accent)] truncate block transition-colors leading-tight"
                    >
                      {activePost.author_name || author?.full_name || 'Campus Student'}
                    </Link>
                    <p className="text-[10px] text-[#78716C] font-medium truncate mt-0.5">
                      {timeAgo(activePost.created_at)} · Campus Moment
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="hidden sm:flex w-8 h-8 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-black/5 items-center justify-center transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Caption / Content Area */}
              <div className="py-4 flex-1 overflow-y-auto max-h-[180px] sm:max-h-[260px] text-xs font-medium text-[#1C1917] leading-relaxed">
                {activePost.content ? (
                  <p className="whitespace-pre-line">{activePost.content}</p>
                ) : (
                  <p className="text-[#A8A29E] italic text-[11px]">No caption provided</p>
                )}
              </div>

              {/* Engagement & Actions Bar */}
              <div className="pt-3 border-t border-[#E7E5E4] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Heart Like Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(activePost)}
                      className={`flex items-center gap-1.5 cursor-pointer active:scale-90 transition-all ${
                        likedStateMap[activePost.id] ? 'text-rose-600' : 'text-[#78716C] hover:text-rose-600'
                      }`}
                    >
                      <Heart
                        size={20}
                        className={likedStateMap[activePost.id] ? 'fill-rose-600 text-rose-600' : ''}
                      />
                      <span className="text-xs font-bold tabular-nums">
                        {likesMap[activePost.id] ?? (activePost.likes_count || 0)}
                      </span>
                    </button>

                    {/* Open Comments / Post Page */}
                    <Link
                      href={`/posts/${activePost.id}`}
                      className="flex items-center gap-1 text-[#78716C] hover:text-[var(--accent)] text-xs font-bold transition-colors cursor-pointer"
                      title="View Comments & Details"
                    >
                      <MessageCircle size={19} />
                    </Link>

                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={() => handleShare(activePost)}
                      className="text-[#78716C] hover:text-[var(--accent)] transition-colors cursor-pointer active:scale-90"
                      title="Share Moment"
                    >
                      {copiedLink ? <Check size={19} className="text-emerald-600" /> : <Share2 size={19} />}
                    </button>
                  </div>

                  {/* Can Delete Option */}
                  {(canDelete || (currentUserId && activePost.user_id === currentUserId)) && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(activePost.id, e)}
                      disabled={deletingId === activePost.id}
                      className="text-[#78716C] hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Moment"
                    >
                      {deletingId === activePost.id ? (
                        <Loader2 size={16} className="animate-spin text-rose-500" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>

                {/* View Full Post Button */}
                <Link
                  href={`/posts/${activePost.id}`}
                  className="w-full py-2.5 rounded-full bg-[#1C1917] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-2xs whitespace-nowrap flex-shrink-0"
                >
                  <span>View Post &amp; Discussion</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
