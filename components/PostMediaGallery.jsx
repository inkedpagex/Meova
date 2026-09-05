'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, RefreshCw, AlertCircle, Volume2, VolumeX } from '@/lib/icons';
import {
  isVideoUrl,
  optimizeCloudinaryUrl,
  getCloudinaryLqipUrl,
  getCloudinaryVideoThumbnail,
  optimizeCloudinaryVideoUrl,
} from '@/utils/imageOptimizer';

/**
 * GallerySlide — Individual slide in the carousel track.
 * Supports progressive image rendering and auto-play video management.
 */
function GallerySlide({
  url,
  index,
  isActive,
  isInView,
  isMuted,
  onToggleMute,
  onMediaClick,
}) {
  const isVideo = isVideoUrl(url);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Auto-play / pause video when active slide changes or scrolls into view
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const vid = videoRef.current;
    vid.defaultMuted = true;
    vid.muted = isMuted;

    if (isActive && isInView) {
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, [isVideo, isActive, isInView, isMuted]);

  const toggleVideoPlayback = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const fullImageUrl = optimizeCloudinaryUrl(url, { width: 850 });
  const lqipUrl = getCloudinaryLqipUrl(url);
  const videoPosterUrl = getCloudinaryVideoThumbnail(url, { width: 850 });
  const optimizedVideoUrl = optimizeCloudinaryVideoUrl(url, { width: 720 });

  if (hasError) {
    return (
      <div className="min-w-full w-full h-full flex-shrink-0 flex flex-col items-center justify-center gap-2 text-[#78716C] p-4 text-center">
        <AlertCircle size={28} className="text-amber-500" />
        <p className="text-xs font-semibold text-[#1C1917]">Unable to load media</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setHasError(false);
            setIsLoaded(false);
          }}
          className="px-3 py-1.5 rounded-full bg-[var(--accent)] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
        >
          <RefreshCw size={12} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div
        onClick={toggleVideoPlayback}
        className="min-w-full w-full h-full flex-shrink-0 relative flex items-center justify-center cursor-pointer select-none"
      >
        <video
          ref={videoRef}
          src={optimizedVideoUrl}
          poster={videoPosterUrl}
          autoPlay
          playsInline
          muted={isMuted}
          loop
          preload="auto"
          onLoadedData={() => {
            if (isActive && isInView && videoRef.current) {
              videoRef.current.defaultMuted = true;
              videoRef.current.muted = isMuted;
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          }}
          onCanPlay={() => {
            if (isActive && isInView && videoRef.current && videoRef.current.paused) {
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
          className="w-full h-full max-h-[500px] object-contain rounded-[16px] pointer-events-none"
        />

        {/* Video Play/Pause Overlay Indicator */}
        {!isPlaying && isActive && isInView && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity">
            <div className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs shadow-lg">
              <Play size={22} className="ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Video Mute/Unmute Toggle */}
        {isActive && isInView && (
          <button
            type="button"
            onClick={onToggleMute}
            className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/65 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        if (onMediaClick) onMediaClick(url, index);
      }}
      className="min-w-full w-full h-full flex-shrink-0 relative flex items-center justify-center cursor-pointer select-none"
    >
      {/* Low-Quality Instant Blurred Placeholder */}
      {!isLoaded && lqipUrl && (
        <img
          src={lqipUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain filter blur-md scale-105 pointer-events-none transition-opacity duration-200"
        />
      )}

      {/* Full High-Res Optimized Image */}
      <img
        src={fullImageUrl}
        alt=""
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full max-h-[500px] object-contain mx-auto transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-90'
        }`}
        loading={index === 0 ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}

/**
 * PostMediaGallery — Silky-Smooth Animated Carousel & Multi-Media Gallery.
 * Supports interactive 1:1 touch dragging, spring physics, and animated horizontal track transitions.
 */
export default function PostMediaGallery({ mediaUrls = [], onMediaClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Interactive Touch Dragging State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const isHorizontalSwipeRef = useRef(null);

  const urls = Array.isArray(mediaUrls)
    ? mediaUrls.filter(Boolean)
    : mediaUrls
    ? [mediaUrls]
    : [];
  const total = urls.length;
  const isCarousel = total > 1;

  const currentUrl = urls[currentIndex] || urls[0] || '';
  const isVideo = isVideoUrl(currentUrl);

  // Viewport Visibility Observer for Feed auto-play / pause
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: '100px 0px 100px 0px', threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Preload neighboring slide images for 0ms instant display
  useEffect(() => {
    if (total > 1 && typeof window !== 'undefined') {
      const nextIdx = (currentIndex + 1) % total;
      const prevIdx = (currentIndex - 1 + total) % total;
      [nextIdx, prevIdx].forEach(idx => {
        const url = urls[idx];
        if (url && !isVideoUrl(url)) {
          const img = new Image();
          img.src = optimizeCloudinaryUrl(url, { width: 850 });
        }
      });
    }
  }, [currentIndex, total, urls]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : prev));
  }, [total]);

  // Touch Dragging Event Handlers
  const handleTouchStart = (e) => {
    if (!isCarousel) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isCarousel || !isDragging) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Detect gesture direction on first significant movement
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // If horizontal swipe, prevent vertical scroll jitter and apply 1:1 drag with edge resistance
    if (isHorizontalSwipeRef.current) {
      let offset = diffX;
      // Elastic resistance at the start and end of carousel
      if ((currentIndex === 0 && diffX > 0) || (currentIndex === total - 1 && diffX < 0)) {
        offset = diffX * 0.3;
      }
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = (e) => {
    if (!isCarousel) return;
    setIsDragging(false);

    const touchDuration = Date.now() - touchStartTimeRef.current;
    const velocity = Math.abs(dragOffset) / (touchDuration || 1);

    // Threshold: either dragged > 45px or quick flick (velocity > 0.3)
    if (dragOffset < -45 || (dragOffset < -20 && velocity > 0.3)) {
      if (currentIndex < total - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } else if (dragOffset > 45 || (dragOffset > 20 && velocity > 0.3)) {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }

    setDragOffset(0);
    isHorizontalSwipeRef.current = null;
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  if (total === 0 || !currentUrl) return null;

  const currentPoster = isVideo ? getCloudinaryVideoThumbnail(currentUrl, { width: 850 }) : optimizeCloudinaryUrl(currentUrl, { width: 850 });

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative w-full ${
        isCarousel
          ? 'h-[360px] sm:h-[440px]' // Fixed uniform height for multi-item carousel (Zero layout jumping on swipe)
          : 'max-h-[500px] min-h-[220px]' // Single item adaptive height
      } rounded-[18px] overflow-hidden bg-[#FAFAF8] border border-[#E7E5E4] flex items-center justify-center select-none group/media shadow-xs`}
    >
      {/* ── AMBIENT BLURRED BACKDROP (Fills Letterboxed Empty Space Elegantly) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src={currentPoster}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover filter blur-2xl opacity-20 scale-125 transition-all duration-300"
        />
      </div>

      {/* ── SILKY-SMOOTH HORIZONTAL SLIDER TRACK ── */}
      <div
        className="relative z-10 flex w-full h-full"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        {urls.map((url, idx) => (
          <GallerySlide
            key={`${url}-${idx}`}
            url={url}
            index={idx}
            isActive={idx === currentIndex}
            isInView={isInView}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onMediaClick={onMediaClick}
          />
        ))}
      </div>

      {/* ── Multi-Media Carousel Badge (e.g. 1/4) ── */}
      {isCarousel && (
        <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold tracking-wider shadow-sm pointer-events-none">
          {currentIndex + 1}/{total}
        </div>
      )}

      {/* ── Desktop Carousel Navigation Controls ── */}
      {isCarousel && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white items-center justify-center transition-all opacity-85 hover:opacity-100 shadow-md active:scale-90 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
          )}

          {currentIndex < total - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white items-center justify-center transition-all opacity-85 hover:opacity-100 shadow-md active:scale-90 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          )}

          {/* ── Pagination Dots with Smooth Pill Expansion ── */}
          <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
            {urls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-5 bg-[var(--accent)] shadow-xs'
                    : 'w-1.5 bg-black/35'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
