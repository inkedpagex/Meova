'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Share2, MessageCircle, Sparkles, MoreHorizontal, Copy, Trash2, ShieldAlert, Loader2 } from '@/lib/icons';
import { getCartoonAvatar } from '../../../utils/avatar';
import { toast } from '../../../lib/toast';
import { formatPostDate } from '../../../utils/dateFormatter';

export default function PostCardClient({ post, initialIsLiked = false, currentUserId = null, currentUserRole = null }) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [animatingHeart, setAnimatingHeart] = useState(false);
  const [floatingHeart, setFloatingHeart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const lastTapRef = useRef(0);

  const isOwnPost = currentUserId && (post.user_id === currentUserId);
  const isHostOrAdmin = currentUserRole === 'verified_host' || currentUserRole === 'campus_lead' || currentUserRole === 'admin';

  const handleDeletePost = async () => {
    if (!window.confirm(isOwnPost ? 'Delete this moment?' : 'Moderate and delete this post as Campus Host?')) return;
    setIsDeleting(true);
    try {
      if (isOwnPost) {
        const res = await fetch(`/api/posts?id=${post.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete post');
      } else {
        const res = await fetch('/api/host/moderate-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id, action: 'delete', reason: 'Host moderation removal' }),
        });
        if (!res.ok) throw new Error('Failed to moderate post');
      }
      toast.success('Post removed successfully!');
      router.push('/');
    } catch (err) {
      toast.error(err.message || 'Error deleting post');
      setIsDeleting(false);
    }
  };

  const handleToggleLike = useCallback(async (forceLike = false) => {
    if (forceLike && isLiked) {
      setFloatingHeart(true);
      setTimeout(() => setFloatingHeart(false), 800);
      return;
    }

    const nextLiked = forceLike ? true : !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    // Instant 0ms Optimistic UI
    setIsLiked(nextLiked);
    setLikesCount(nextCount);
    setAnimatingHeart(true);
    setTimeout(() => setAnimatingHeart(false), 350);

    if (forceLike) {
      setFloatingHeart(true);
      setTimeout(() => setFloatingHeart(false), 800);
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
  }, [isLiked, likesCount, post.id]);

  const handlePhotoClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleToggleLike(true);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleShare = () => {
    const postUrl = typeof window !== 'undefined' ? window.location.href : `https://meova.in/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${post.author_name || 'Campus Student'} on Meova`,
        text: post.content || 'Check out this moment on Meova',
        url: postUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied!');
    }
  };

  const authorPhoto = post.author_photo || getCartoonAvatar(post.author_name || 'Student');

  return (
    <div className="bg-white border border-black/10 rounded-[28px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] hover:border-black/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4.5 py-3.5 border-b border-black/5">
        <Link
          href={isOwnPost ? '/profile' : `/users/${post.user_id}`}
          className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 group/author"
        >
          {/* Avatar with online dot */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden p-[1px] ring-1 ring-black/10 group-hover/author:ring-[#F05A00] transition-all">
              <img
                src={authorPhoto}
                alt=""
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getCartoonAvatar(post.author_name || 'Student');
                }}
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="min-w-0">
            <h4 className="text-[14px] font-black text-black group-hover/author:text-[#F05A00] transition-colors leading-tight truncate">
              {post.author_name || 'Campus Student'}
            </h4>
            <p className="text-[11px] text-black/65 font-bold mt-0.5 flex items-center gap-1.5 leading-none truncate">
              <span>{post.author_branch?.split('(')?.[0]?.trim() || 'Student'}</span>
              <span className="text-[#F05A00] font-black">·</span>
              <span>{post.location || 'Campus'}</span>
              <span className="text-[#F05A00] font-black">·</span>
              <span>{formatPostDate(post.created_at)}</span>
            </p>
          </div>
        </Link>

        {/* 3-dots Menu Button */}
        <div className="relative flex-shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center text-black/60 hover:text-black hover:bg-orange-50 rounded-full transition-colors cursor-pointer"
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-2 w-44 bg-white shadow-xl rounded-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 border border-black/10">
                {isOwnPost ? (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setShowMenu(false);
                      handleDeletePost();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>{isDeleting ? 'Deleting...' : 'Delete post'}</span>
                  </button>
                ) : isHostOrAdmin ? (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setShowMenu(false);
                      handleDeletePost();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <ShieldAlert size={14} />
                    <span>{isDeleting ? 'Removing...' : 'Moderate'}</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    handleShare();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] font-bold text-black hover:bg-orange-50 hover:text-[#F05A00] rounded-xl transition-colors cursor-pointer"
                >
                  <Copy size={14} />
                  <span>Copy link</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Photo */}
      {post.media_urls?.[0] && (
        <div
          onClick={handlePhotoClick}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[560px] cursor-pointer select-none overflow-hidden bg-black/5"
        >
          <img
            src={post.media_urls[0]}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.01]"
          />

          {/* Category glass chip */}
          {post.category && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-black/60 text-white backdrop-blur-md border border-white/20 tracking-wider uppercase">
              {post.category}
            </span>
          )}

          {/* Floating Instagram Heart Burst */}
          {floatingHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart
                size={84}
                className="fill-rose-500 text-white drop-shadow-2xl animate-in zoom-in-50 fade-in duration-200"
                style={{
                  filter: 'drop-shadow(0 12px 35px rgba(244,63,94,0.8))',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Action Bar & Caption */}
      <div className="px-4.5 pt-3 pb-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike(false);
              }}
              className="flex items-center gap-1.5 select-none active:scale-90 transition-transform cursor-pointer group/like"
            >
              <Heart
                size={21}
                className={`transition-all duration-150 ${
                  isLiked
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-black/60 group-hover/like:text-rose-500'
                } ${animatingHeart ? 'scale-125' : 'scale-100'}`}
              />
              {likesCount > 0 && (
                <span className={`text-[12.5px] font-black tabular-nums leading-none ${isLiked ? 'text-rose-600' : 'text-black'}`}>
                  {likesCount}
                </span>
              )}
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="text-black/60 hover:text-[#F05A00] transition-colors cursor-pointer active:scale-90"
              title="Share"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Caption */}
        {post.content && (
          <p className="text-[13.5px] text-black leading-snug font-medium">
            <span className="font-black text-black mr-1.5">{post.author_name}</span>
            <span>
              {post.content
                .replace(/[📍🏷️][^]*$/gu, '')
                .replace(/[\u{1F300}-\u{1FAD6}\u{2000}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
                .trim()}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
