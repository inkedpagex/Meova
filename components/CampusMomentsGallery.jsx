'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft, ChevronRight } from '@/lib/icons';
import { toast } from '@/lib/toast';
import PostGridThumbnail from './profile/PostGridThumbnail';
import PostDetailView from './profile/PostDetailView';

export default function CampusMomentsGallery({
  posts = [],
  currentUserId = null,
  author = null,
  canDelete = false,
  onDeletePost = null,
}) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if initial URL has ?post=[id]
    if (typeof window !== 'undefined' && Array.isArray(posts) && posts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('post');
      if (postId) {
        const found = posts.findIndex((p) => String(p.id) === String(postId));
        if (found !== -1) {
          setSelectedIndex(found);
        }
      }
    }
  }, [posts]);

  // Handle opening a post with history sync
  const handleOpenPost = (idx) => {
    setSelectedIndex(idx);
    const post = posts[idx];
    if (post && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('post', post.id);
      window.history.pushState({ postModal: true, postId: post.id }, '', url.toString());
    }
  };

  // Handle closing modal
  const handleCloseModal = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.history.state?.postModal) {
        window.history.back();
      } else {
        const url = new URL(window.location.href);
        url.searchParams.delete('post');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        setSelectedIndex(null);
      }
    } else {
      setSelectedIndex(null);
    }
  }, []);

  // Popstate listener for browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (selectedIndex !== null) {
        setSelectedIndex(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedIndex]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
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
  }, [selectedIndex, posts.length, handleCloseModal]);

  const handleDelete = async (postId) => {
    try {
      if (onDeletePost) {
        await onDeletePost(postId);
      } else {
        const res = await fetch(`/api/posts?id=${postId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete moment');
        toast.success('Moment deleted');
        router.refresh();
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err.message || 'Error deleting moment');
    }
  };

  // Empty State — Clean Instagram Style
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-14 px-4 rounded-[24px] bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10">
        <div className="w-16 h-16 rounded-full border border-black/15 dark:border-white/15 flex items-center justify-center mx-auto mb-3.5 text-black/50 dark:text-white/50">
          <Camera size={26} />
        </div>
        <p className="text-sm font-black text-black dark:text-white tracking-tight">No Moments Shared Yet</p>
        <p className="text-xs text-black/60 dark:text-white/60 mt-1 max-w-xs mx-auto font-medium">
          Photos and moments shared on campus will appear here in your grid.
        </p>
      </div>
    );
  }

  const activePost = selectedIndex !== null ? posts[selectedIndex] : null;

  return (
    <>
      {/* ── 3-col Mobile, 4-col Desktop Clean Instagram Grid ── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
        {posts.map((post, idx) => (
          <PostGridThumbnail
            key={post.id}
            post={post}
            onClick={() => handleOpenPost(idx)}
          />
        ))}
      </div>

      {/* ── Instagram-Style Lightbox / Full-screen Takeover mounted via React Portal ── */}
      {mounted && activePost && createPortal(
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-[999999] bg-black/70 md:backdrop-blur-xs flex items-center justify-center p-0 md:p-6 anim-fade-in"
        >
          {/* Desktop Previous Arrow */}
          {posts.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : posts.length - 1));
              }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-[1000000] w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer border border-white/15 shadow-xl"
              title="Previous (←)"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Desktop Next Arrow */}
          {posts.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
              }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-[1000000] w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer border border-white/15 shadow-xl"
              title="Next (→)"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Modal Container: Fullscreen on mobile, rounded card on desktop */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full md:w-[920px] md:h-[640px] md:max-h-[85vh] bg-white rounded-none md:rounded-[28px] overflow-hidden shadow-2xl md:border md:border-black/10 relative flex flex-col cursor-default"
          >
            <PostDetailView
              post={activePost}
              author={author}
              currentUserId={currentUserId}
              onClose={handleCloseModal}
              onDeletePost={handleDelete}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
