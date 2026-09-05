'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Share2, MessageCircle, Sparkles, MoreHorizontal, Copy, Trash2, ShieldAlert, Loader2 } from '@/lib/icons';
import { getCartoonAvatar } from '../../../utils/avatar';
import { toast } from '../../../lib/toast';
import { formatPostDate } from '../../../utils/dateFormatter';
import PostMediaGallery from '@/components/PostMediaGallery';
import MessagePillButton from '@/components/MessagePillButton';

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
    <div className="bg-white border border-black/10 rounded-[28px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)] transition-all mb-4">
      {/* ── Card Header (56px) ───────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14">
        <Link
          href={isOwnPost ? '/profile' : `/users/${post.user_id}`}
          className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 group/author"
        >
          {/* Avatar with online dot */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden p-[1px] ring-1 ring-black/[0.08] group-hover/author:ring-[var(--accent)] transition-all">
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
            <h4 className="text-[14px] font-bold text-black group-hover/author:text-[var(--accent)] transition-colors leading-tight truncate">
              {post.author_name || 'Campus Student'}
            </h4>
            <p className="text-[12px] text-black/70 font-semibold mt-0.5 flex items-center gap-1.5 leading-none truncate">
              <span>{post.author_branch?.split('(')?.[0]?.trim() || 'Student'}</span>
              <span className="text-black/35">·</span>
              <span>{post.location || 'Campus'}</span>
              <span className="text-black/35">·</span>
              <span>{formatPostDate(post.created_at)}</span>
            </p>
          </div>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {!isOwnPost && post.user_id && (
            <MessagePillButton
              targetUserId={post.user_id}
              targetName={post.author_name}
              currentUserId={currentUserId}
              size="sm"
            />
          )}

          {/* 3-dots Menu Button */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 flex items-center justify-center text-black/60 hover:text-black hover:bg-black/5 rounded-full transition-colors cursor-pointer"
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
                <div className="absolute right-0 top-full mt-2 w-44 bg-white shadow-[0_4px_16px_rgba(28,25,23,0.08)] rounded-[20px] p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 border border-black/10">
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-bold text-black hover:bg-[var(--accent-tint-10)] hover:text-[var(--accent)] rounded-xl transition-colors cursor-pointer"
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

      {/* ── Photo / Media Gallery (Zero-Crop Adaptive Container) ───────────────────────────── */}
      {(post.media_urls?.length > 0 || post.photoUrl) && (
        <div className="px-3.5 pt-0.5 pb-1 relative">
          <PostMediaGallery
            mediaUrls={post.media_urls || [post.photoUrl]}
            onMediaClick={handlePhotoClick}
          />

          {/* Floating Heart Burst */}
          {floatingHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart
                size={84}
                className="fill-[var(--accent)] text-white drop-shadow-2xl animate-in zoom-in-50 fade-in duration-200"
                style={{
                  filter: 'drop-shadow(0 12px 35px rgba(240,90,0,0.8))',
                }}
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
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-black/5 select-none active:scale-90 transition-all cursor-pointer group/like whitespace-nowrap flex-shrink-0"
            >
              <Heart
                size={20}
                className={`transition-all duration-150 ${
                  isLiked
                    ? 'fill-[var(--accent)] text-[var(--accent)]'
                    : 'text-black/70 group-hover/like:text-[var(--accent)]'
                } ${animatingHeart ? 'scale-125' : 'scale-100'}`}
              />
              {likesCount > 0 && (
                <span
                  className={`text-[13px] font-bold tabular-nums leading-none ${
                    isLiked ? 'text-[var(--accent)]' : 'text-black/70'
                  }`}
                >
                  {likesCount}
                </span>
              )}
            </button>

            {/* Message with author */}
            {!isOwnPost && post.user_id && (
              <MessagePillButton
                targetUserId={post.user_id}
                targetName={post.author_name}
                currentUserId={currentUserId}
                size="md"
              />
            )}

            {/* Share */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-1.5 rounded-full hover:bg-black/5 text-black/70 hover:text-[var(--accent)] transition-colors cursor-pointer active:scale-90 whitespace-nowrap flex-shrink-0"
              title="Share"
            >
              <Share2 size={19} />
            </button>
          </div>
        </div>

        {/* Caption */}
        {post.content && (
          <p className="text-[13.5px] text-black leading-relaxed font-normal">
            <span className="font-bold text-black mr-1.5">
              {post.author_name || 'Campus Student'}
            </span>
            <span>{post.content}</span>
          </p>
        )}
      </div>
    </div>
  );
}
