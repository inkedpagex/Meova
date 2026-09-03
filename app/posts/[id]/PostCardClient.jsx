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
    <div className="bg-white border border-[#E7E5E4] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(28,25,23,0.06)] transition-all mb-4">
      {/* ── Card Header (56px) ───────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14">
        <Link
          href={isOwnPost ? '/profile' : `/users/${post.user_id}`}
          className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 group/author"
        >
          {/* Avatar with online dot */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden p-[1px] ring-1 ring-black/[0.08] group-hover/author:ring-[#6D28D9] transition-all">
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
            <h4 className="text-[14px] font-semibold text-[#1C1917] group-hover/author:text-[#6D28D9] transition-colors leading-tight truncate">
              {post.author_name || 'Campus Student'}
            </h4>
            <p className="text-[12px] text-[#78716C] font-medium mt-0.5 flex items-center gap-1.5 leading-none truncate">
              <span>{post.author_branch?.split('(')?.[0]?.trim() || 'Student'}</span>
              <span className="text-[#D6D3D1]">·</span>
              <span>{post.location || 'Campus'}</span>
              <span className="text-[#D6D3D1]">·</span>
              <span>{formatPostDate(post.created_at)}</span>
            </p>
          </div>
        </Link>

        {/* 3-dots Menu Button */}
        <div className="relative flex-shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
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
              <div className="absolute right-0 top-full mt-2 w-44 bg-white shadow-[0_4px_16px_rgba(28,25,23,0.08)] rounded-[16px] p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 border border-[#E7E5E4]">
                {isOwnPost ? (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setShowMenu(false);
                      handleDeletePost();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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

      {/* ── Photo (Refined Framed Container) ───────────────────────────── */}
      {post.media_urls?.[0] && (
        <div className="px-3.5 pt-0.5 pb-1">
          <div
            onClick={handlePhotoClick}
            className="relative w-full max-h-[440px] sm:max-h-[480px] rounded-[14px] overflow-hidden bg-[#FAFAF8] border border-[#E7E5E4]/60 cursor-pointer select-none group/media flex items-center justify-center"
          >
            <img
              src={post.media_urls[0]}
              alt=""
              className="w-full max-h-[440px] sm:max-h-[480px] object-cover transition-transform duration-300 group-hover/media:scale-[1.01]"
            />

            {/* Showcase Tag Overlay */}
            {post.category && (
              <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-black/60 text-white backdrop-blur-xs tracking-wide">
                {post.category}
              </span>
            )}

            {/* Floating Heart Burst */}
            {floatingHeart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <Heart
                  size={84}
                  className="fill-[#6D28D9] text-white drop-shadow-2xl animate-in zoom-in-50 fade-in duration-200"
                  style={{
                    filter: 'drop-shadow(0 12px 35px rgba(109,40,217,0.8))',
                  }}
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
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-[#FAFAF8] select-none active:scale-90 transition-all cursor-pointer group/like"
            >
              <Heart
                size={20}
                className={`transition-all duration-150 ${
                  isLiked
                    ? 'fill-[#6D28D9] text-[#6D28D9]'
                    : 'text-[#78716C] group-hover/like:text-[#6D28D9]'
                } ${animatingHeart ? 'scale-125' : 'scale-100'}`}
              />
              {likesCount > 0 && (
                <span
                  className={`text-[13px] font-bold tabular-nums leading-none ${
                    isLiked ? 'text-[#6D28D9]' : 'text-[#78716C]'
                  }`}
                >
                  {likesCount}
                </span>
              )}
            </button>

            {/* Chat / Message Button */}
            {post.user_id && (
              <Link
                href={`/messages?userId=${post.user_id}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-[#F3EEFC] text-[#78716C] hover:text-[#6D28D9] transition-all cursor-pointer active:scale-90"
                title="Chat with Author"
              >
                <MessageCircle size={19} />
                <span className="text-[12px] font-bold">Chat</span>
              </Link>
            )}

            {/* Share */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-1.5 rounded-full hover:bg-[#FAFAF8] text-[#78716C] hover:text-[#6D28D9] transition-colors cursor-pointer active:scale-90"
              title="Share"
            >
              <Share2 size={19} />
            </button>
          </div>
        </div>

        {/* Caption */}
        {post.content && (
          <p className="text-[13.5px] text-[#1C1917] leading-relaxed font-normal">
            <span className="font-bold text-[#1C1917] mr-1.5">
              {post.author_name || 'Campus Student'}
            </span>
            <span>{post.content}</span>
          </p>
        )}
      </div>
    </div>
  );
}
