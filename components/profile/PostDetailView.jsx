'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart, Share2, ArrowLeft, X, Sparkles, Send, Loader2, Check,
  ChevronLeft, ChevronRight
} from '@/lib/icons';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import { isVideoUrl } from '@/utils/imageOptimizer';
import { toast } from '@/lib/toast';
import PostOptionsMenu from './PostOptionsMenu';

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

export default function PostDetailView({
  post,
  author = null,
  currentUserId = null,
  onClose,
  onDeletePost = null,
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [mediaIdx, setMediaIdx] = useState(0);
  const lastTapRef = useRef(0);

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsEndRef = useRef(null);

  const isOwner = currentUserId && (post.user_id === currentUserId);

  const mediaArr = Array.isArray(post.media_urls)
    ? post.media_urls.filter(Boolean)
    : (post.photoUrl ? [post.photoUrl] : []);

  const currentMedia = mediaArr[mediaIdx] || mediaArr[0] || null;
  const isCurrentVideo = currentMedia && isVideoUrl(currentMedia);
  const hasMedia = mediaArr.length > 0 && !imgBroken;
  const isMultiMedia = mediaArr.length > 1;

  // Fetch comments
  useEffect(() => {
    let isMounted = true;
    async function loadComments() {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      } catch (e) {
        console.warn('Failed to load comments', e);
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    }
    loadComments();
    return () => {
      isMounted = false;
    };
  }, [post.id]);

  // Double tap to like
  const handleToggleLike = useCallback(
    async (forceLike = false) => {
      if (forceLike && isLiked) {
        setShowFloatingHeart(true);
        setTimeout(() => setShowFloatingHeart(false), 800);
        return;
      }

      const nextLiked = forceLike ? true : !isLiked;
      const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

      setIsLiked(nextLiked);
      setLikesCount(nextCount);

      if (forceLike) {
        setShowFloatingHeart(true);
        setTimeout(() => setShowFloatingHeart(false), 800);
      }

      try {
        const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
        if (!res.ok) {
          setIsLiked(isLiked);
          setLikesCount(likesCount);
        }
      } catch {
        setIsLiked(isLiked);
        setLikesCount(likesCount);
      }
    },
    [isLiked, likesCount, post.id]
  );

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      handleToggleLike(true);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleShare = () => {
    const postUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/posts/${post.id}`
      : `https://meova.in/posts/${post.id}`;
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
      toast.success('Post link copied to clipboard!');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } catch {
      toast.error('Network error posting comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const authorName = post.author_name || author?.full_name || 'Campus Student';
  const authorPhoto = post.author_photo || author?.photo_url || getUserAvatarUrl(author) || getCartoonAvatar(authorName);

  // Common Media Box Component
  const renderMedia = (isMobileView = false) => (
    <div
      onClick={handleDoubleTap}
      className={`relative bg-black flex items-center justify-center select-none overflow-hidden ${
        isMobileView
          ? 'w-full aspect-square max-h-[50vh] flex-shrink-0'
          : 'flex-1 md:w-[58%] h-full min-h-[460px] bg-black'
      }`}
    >
      {hasMedia ? (
        isCurrentVideo ? (
          <video
            key={currentMedia}
            src={currentMedia}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain max-h-[85vh]"
          />
        ) : (
          <img
            key={currentMedia}
            src={currentMedia}
            alt=""
            onError={() => setImgBroken(true)}
            className="w-full h-full object-contain max-h-[85vh]"
          />
        )
      ) : (
        <div className="p-8 text-center text-white max-w-md space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center text-[#7657D9]">
            <Sparkles size={22} />
          </div>
          <p className="text-base sm:text-lg font-bold leading-relaxed whitespace-pre-line text-white/95">
            {post.content || 'Campus Moment'}
          </p>
        </div>
      )}

      {/* Multi-media carousel navigation */}
      {isMultiMedia && (
        <>
          {/* Previous Media Arrow */}
          {mediaIdx > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMediaIdx((prev) => Math.max(0, prev - 1));
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer transition-all active:scale-95 shadow-md"
              title="Previous item"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Next Media Arrow */}
          {mediaIdx < mediaArr.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMediaIdx((prev) => Math.min(mediaArr.length - 1, prev + 1));
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer transition-all active:scale-95 shadow-md"
              title="Next item"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {/* Top-Right Index Badge */}
          <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-sm text-white text-[11px] font-bold tracking-tight shadow-md">
            {mediaIdx + 1}/{mediaArr.length}
          </div>

          {/* Bottom Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
            {mediaArr.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === mediaIdx ? 'bg-white w-4' : 'bg-white/45 w-1.5'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Double-tap Floating Heart Animation */}
      {showFloatingHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart size={92} className="fill-white text-white drop-shadow-2xl animate-ping" />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full bg-white flex flex-col md:flex-row overflow-hidden select-none font-sans text-black">
      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE VIEW (< 768px): Instagram Full-screen Post Layout
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex md:hidden flex-col w-full h-full overflow-hidden bg-white">
        {/* Mobile Top Bar */}
        <div className="h-13 px-3.5 bg-white border-b border-black/10 flex items-center justify-between flex-shrink-0 z-30">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-black hover:text-[#7657D9] transition-colors cursor-pointer py-1.5 pr-3 -ml-1 active:scale-95"
            title="Back to profile"
          >
            <ArrowLeft size={20} className="text-black" />
            <span className="text-sm font-black tracking-tight">Posts</span>
          </button>

          <PostOptionsMenu
            post={post}
            isOwner={isOwner}
            onDelete={onDeletePost}
            buttonClassName="w-9 h-9 flex items-center justify-center text-black/70 hover:text-black rounded-full transition-colors active:scale-95"
          />
        </div>

        {/* Mobile Scrollable Post Body */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Author Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-black/5 flex-shrink-0">
            <Link
              href={isOwner ? '/profile' : `/users/${post.user_id}`}
              className="flex items-center gap-2.5 min-w-0"
            >
              <img
                src={authorPhoto}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-black/10 flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-black text-black truncate block leading-tight">
                  {authorName}
                </span>
                <span className="text-[10px] text-black/60 font-semibold block leading-tight mt-0.5">
                  {timeAgo(post.created_at)} · Campus
                </span>
              </div>
            </Link>
          </div>

          {/* Media Area */}
          {renderMedia(true)}

          {/* Actions Bar (Like + Share) */}
          <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-black/5 bg-white flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleToggleLike()}
                className="flex items-center gap-1.5 text-black hover:text-rose-600 transition-colors cursor-pointer active:scale-90"
                title="Like"
              >
                <Heart
                  size={22}
                  className={isLiked ? 'fill-rose-600 text-rose-600' : 'text-black/80 hover:text-rose-600'}
                />
                <span className="text-xs font-black tabular-nums">{likesCount}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="text-black/80 hover:text-[#7657D9] transition-colors cursor-pointer active:scale-90"
                title="Share"
              >
                <Share2 size={21} />
              </button>
            </div>

            <span className="text-[10px] font-bold text-black/40 uppercase tracking-wider">
              {timeAgo(post.created_at)}
            </span>
          </div>

          {/* Caption */}
          {post.content && (
            <div className="px-3.5 py-2.5 text-xs text-black/90 leading-relaxed border-b border-black/5 bg-white">
              <span className="font-black text-black mr-2">{authorName}</span>
              <span className="font-medium whitespace-pre-line">{post.content}</span>
            </div>
          )}

          {/* Comments List */}
          <div className="p-3.5 space-y-3 flex-1 bg-white">
            <p className="text-[11px] font-black text-black uppercase tracking-wider">
              Comments ({comments.length})
            </p>

            {loadingComments ? (
              <div className="py-6 flex items-center justify-center text-black/40 gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[11px] font-semibold">Loading comments...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-bold text-black/60">No comments yet.</p>
                <p className="text-[11px] text-black/40">Be the first to comment!</p>
              </div>
            ) : (
              comments.map((c) => {
                const cPhoto = c.author_photo || getCartoonAvatar(c.author_name || 'Student');
                return (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <img
                      src={cPhoto}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-black/10 flex-shrink-0 mt-0.5"
                    />
                    <div className="space-y-0.5 min-w-0 flex-1 leading-snug">
                      <span className="font-black text-black mr-1.5 text-[11.5px]">
                        {c.author_name || 'Student'}
                      </span>
                      <span className="text-black/85 text-[11.5px] whitespace-pre-line">{c.content}</span>
                      <p className="text-[9.5px] text-black/40 font-semibold mt-0.5">
                        {timeAgo(c.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Mobile Pinned Comment Input */}
        <form
          onSubmit={handlePostComment}
          className="p-3 bg-white border-t border-black/10 flex items-center gap-2 flex-shrink-0"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            className="flex-1 px-3.5 py-2 rounded-full bg-black/5 border border-black/10 text-xs font-medium text-black placeholder:text-black/40 focus:outline-none focus:border-[#7657D9] focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submittingComment}
            className="px-4 py-2 rounded-full bg-[#7657D9] text-white text-xs font-bold hover:bg-[#6848C9] active:bg-[#5B3FB3] disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-1"
          >
            {submittingComment ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <span>Post</span>
            )}
          </button>
        </form>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP VIEW (>= 768px): Side-by-Side Instagram Modal Layout
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex w-full h-full flex-row overflow-hidden">
        {/* Left Media Area (~58%) */}
        {renderMedia(false)}

        {/* Right Details Column (~42%) */}
        <div className="md:w-[42%] h-full max-h-[85vh] border-l border-black/10 flex flex-col justify-between bg-white text-black flex-shrink-0">
          {/* Author Header */}
          <div className="flex items-center justify-between p-4 border-b border-black/10 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={isOwner ? '/profile' : `/users/${post.user_id}`}
                className="w-10 h-10 rounded-full overflow-hidden border border-black/10 flex-shrink-0 hover:scale-105 transition-transform"
              >
                <img
                  src={authorPhoto}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="min-w-0">
                <Link
                  href={isOwner ? '/profile' : `/users/${post.user_id}`}
                  className="text-xs font-black text-black hover:text-[#7657D9] truncate block transition-colors leading-tight"
                >
                  {authorName}
                </Link>
                <p className="text-[11px] text-black/60 font-semibold truncate mt-0.5">
                  {timeAgo(post.created_at)} · Campus
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <PostOptionsMenu
                post={post}
                isOwner={isOwner}
                onDelete={onDeletePost}
                buttonClassName="w-8 h-8 flex items-center justify-center text-black/60 hover:text-black hover:bg-black/5 rounded-full transition-colors active:scale-95"
              />
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-black/60 hover:text-black hover:bg-black/5 rounded-full transition-colors active:scale-95 cursor-pointer ml-1"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Middle: Caption + Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-medium">
            {/* Post Caption */}
            {hasMedia && post.content && (
              <div className="flex items-start gap-3 pb-3 border-b border-black/5">
                <img
                  src={authorPhoto}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-black/10 flex-shrink-0"
                />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="font-black text-black mr-2 text-xs">{authorName}</span>
                  <span className="text-black/90 text-xs leading-relaxed whitespace-pre-line">{post.content}</span>
                  <p className="text-[10px] text-black/40 font-semibold mt-1">{timeAgo(post.created_at)}</p>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="space-y-3.5">
              {loadingComments ? (
                <div className="py-6 flex items-center justify-center text-black/40 gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[11px] font-semibold">Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs font-bold text-black/60">No comments yet.</p>
                  <p className="text-[11px] text-black/40">Start the conversation below.</p>
                </div>
              ) : (
                comments.map((c) => {
                  const cPhoto = c.author_photo || getCartoonAvatar(c.author_name || 'Student');
                  return (
                    <div key={c.id} className="flex items-start gap-3">
                      <img
                        src={cPhoto}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-black/10 flex-shrink-0 mt-0.5"
                      />
                      <div className="space-y-0.5 min-w-0 flex-1 leading-snug">
                        <span className="font-black text-black mr-1.5 text-[11.5px]">
                          {c.author_name || 'Student'}
                        </span>
                        <span className="text-black/85 text-[11.5px] whitespace-pre-line">{c.content}</span>
                        <p className="text-[9.5px] text-black/40 font-semibold mt-0.5">
                          {timeAgo(c.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* Action Row: Like + Share ONLY */}
          <div className="px-4 py-2.5 border-t border-black/10 flex items-center justify-between flex-shrink-0 bg-white">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleToggleLike()}
                className="flex items-center gap-1.5 text-black hover:text-rose-600 transition-colors cursor-pointer active:scale-90"
                title="Like"
              >
                <Heart
                  size={22}
                  className={isLiked ? 'fill-rose-600 text-rose-600' : 'text-black/80 hover:text-rose-600'}
                />
                <span className="text-xs font-black tabular-nums">{likesCount}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="text-black/80 hover:text-[#7657D9] transition-colors cursor-pointer active:scale-90"
                title="Share"
              >
                <Share2 size={21} />
              </button>
            </div>

            <span className="text-[10px] font-bold text-black/40 uppercase tracking-wider">
              {timeAgo(post.created_at)}
            </span>
          </div>

          {/* Pinned Comment Input Box */}
          <form
            onSubmit={handlePostComment}
            className="p-3 border-t border-black/10 flex items-center gap-2 bg-white flex-shrink-0"
          >
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 px-3.5 py-2 rounded-full bg-black/5 border border-black/10 text-xs font-medium text-black placeholder:text-black/40 focus:outline-none focus:border-[#7657D9] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submittingComment}
              className="px-4 py-2 rounded-full bg-[#7657D9] text-white text-xs font-bold hover:bg-[#6848C9] active:bg-[#5B3FB3] disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-1"
            >
              {submittingComment ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <span>Post</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
