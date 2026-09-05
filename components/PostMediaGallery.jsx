'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, RefreshCw, AlertCircle, Volume2, VolumeX } from '@/lib/icons';
import {
  isVideoUrl,
  optimizeCloudinaryUrl,
  getCloudinaryLqipUrl,
  getCloudinaryVideoThumbnail,
  optimizeCloudinaryVideoUrl,
} from '@/utils/imageOptimizer';

export default function PostMediaGallery({ mediaUrls = [], onMediaClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const touchStartXRef = useRef(0);

  const urls = Array.isArray(mediaUrls)
    ? mediaUrls.filter(Boolean)
    : mediaUrls
    ? [mediaUrls]
    : [];
  const total = urls.length;
  const isCarousel = total > 1;

  const currentUrl = urls[currentIndex] || urls[0] || '';
  const isVideo = isVideoUrl(currentUrl);

  // ── 1. Aggressive 600px Prefetch Viewport Observer ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);

        if (isVideo && videoRef.current) {
          if (visible) {
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { rootMargin: '600px 0px 600px 0px', threshold: 0 } // Starts downloading 600px ahead
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVideo, currentIndex]);

  // ── 2. Carousel Slide Preloading (0ms Instant Next Slide) ──
  useEffect(() => {
    if (total > 1 && typeof window !== 'undefined') {
      const nextIdx = (currentIndex + 1) % total;
      const nextUrl = urls[nextIdx];
      if (nextUrl && !isVideoUrl(nextUrl)) {
        const img = new Image();
        img.src = optimizeCloudinaryUrl(nextUrl, { width: 850 });
      }
    }
  }, [currentIndex, total, urls]);

  // Reset state on slide index switch
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setIsPlaying(false);
  }, [currentIndex]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e) => {
    if (!isCarousel) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!isCarousel) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

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

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  if (total === 0 || !currentUrl) return null;

  const fullImageUrl = optimizeCloudinaryUrl(currentUrl, { width: 850 });
  const lqipUrl = getCloudinaryLqipUrl(currentUrl);
  const videoPosterUrl = getCloudinaryVideoThumbnail(currentUrl, { width: 850 });
  const optimizedVideoUrl = optimizeCloudinaryVideoUrl(currentUrl, { width: 720 });

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${
        isCarousel
          ? 'h-[360px] sm:h-[440px]' // Fixed uniform height for multi-item carousel (Zero layout jumping on swipe)
          : 'max-h-[500px] min-h-[220px]' // Single item adaptive height
      } rounded-[18px] overflow-hidden bg-white border border-[#E7E5E4] flex items-center justify-center select-none group/media shadow-xs`}
    >
      {/* ── AMBIENT BLURRED BACKDROP (Fills Letterboxed Empty Space Elegantly) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src={isVideo ? videoPosterUrl : (lqipUrl || fullImageUrl)}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover filter blur-2xl opacity-20 scale-125 transition-opacity duration-300"
        />
      </div>

      {/* ── Error Fallback UI ── */}
      {hasError ? (
        <div className="relative z-10 w-full h-56 flex flex-col items-center justify-center gap-2 text-[#78716C] p-4 text-center">
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
      ) : isVideo ? (
        /* ── VIDEO PLAYER WITH HARDWARE DECODER MANAGEMENT ── */
        <div
          onClick={toggleVideoPlayback}
          className="relative z-10 w-full h-full flex items-center justify-center cursor-pointer"
        >
          {isInView ? (
            <video
              ref={videoRef}
              src={optimizedVideoUrl}
              poster={videoPosterUrl}
              playsInline
              muted={isMuted}
              loop
              preload="auto"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setHasError(true)}
              className="w-full h-full max-h-[500px] object-contain rounded-[16px]"
            />
          ) : (
            <img
              src={videoPosterUrl}
              alt=""
              className="w-full h-full max-h-[500px] object-contain rounded-[16px] opacity-95"
            />
          )}

          {/* Video Play/Pause Overlay Indicator */}
          {!isPlaying && isInView && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity">
              <div className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs shadow-lg">
                <Play size={22} className="ml-1 fill-white" />
              </div>
            </div>
          )}

          {/* Video Mute/Unmute Toggle */}
          {isInView && (
            <button
              type="button"
              onClick={toggleMute}
              className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/65 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}
        </div>
      ) : (
        /* ── PROGRESSIVE INSTANT IMAGE RENDERING ── */
        <div
          onClick={() => {
            if (onMediaClick) onMediaClick(currentUrl, currentIndex);
          }}
          className="relative z-10 w-full h-full flex items-center justify-center cursor-pointer"
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
          {isInView && (
            <img
              key={currentUrl}
              src={fullImageUrl}
              alt=""
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={`w-full h-full max-h-[500px] object-contain mx-auto transition-opacity duration-200 ${
                isLoaded ? 'opacity-100' : 'opacity-90'
              }`}
              decoding="async"
            />
          )}
        </div>
      )}

      {/* ── Multi-Media Carousel Badge (e.g. 1/4) ── */}
      {isCarousel && (
        <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold tracking-wider shadow-sm pointer-events-none">
          {currentIndex + 1}/{total}
        </div>
      )}

      {/* ── Carousel Navigation Controls ── */}
      {isCarousel && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all opacity-85 hover:opacity-100 shadow-md active:scale-90 cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all opacity-85 hover:opacity-100 shadow-md active:scale-90 cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>

          {/* ── Pagination Dots ── */}
          <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
            {urls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-5 bg-[var(--accent)] shadow-xs'
                    : 'w-1.5 bg-black/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
