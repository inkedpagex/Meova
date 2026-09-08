'use client';

import React, { useState } from 'react';
import { Copy, Video } from '@/lib/icons';
import { isVideoUrl, getCloudinaryVideoThumbnail, optimizeCloudinaryUrl } from '@/utils/imageOptimizer';

export default function PostGridThumbnail({ post, onClick }) {
  const [imgBroken, setImgBroken] = useState(false);

  const mediaArr = Array.isArray(post.media_urls)
    ? post.media_urls.filter(Boolean)
    : (post.photoUrl ? [post.photoUrl] : []);

  const firstMedia = mediaArr.length > 0 ? mediaArr[0] : null;
  const isVideo = (firstMedia && isVideoUrl(firstMedia)) || !!post.video_url;
  const isMultiPhoto = mediaArr.length > 1;

  // Determine thumbnail URL:
  // If video -> use Cloudinary video thumbnail (static jpg)
  // If image -> optimize Cloudinary image URL (w_400)
  let thumbnailSrc = null;
  if (firstMedia && !imgBroken) {
    if (isVideo) {
      thumbnailSrc = getCloudinaryVideoThumbnail(firstMedia, { width: 400 });
    } else {
      thumbnailSrc = optimizeCloudinaryUrl(firstMedia, { width: 400, crop: 'fill' });
    }
  }

  const hasMedia = !!thumbnailSrc;

  return (
    <div
      onClick={onClick}
      className="relative aspect-square overflow-hidden bg-black cursor-pointer select-none rounded-[4px] sm:rounded-[6px] border border-black/5 group"
    >
      {hasMedia ? (
        <>
          <img
            src={thumbnailSrc}
            alt=""
            loading="lazy"
            onError={() => {
              // If video thumbnail failed, check if there is an image in the media array to show
              const altImg = mediaArr.find((u) => !isVideoUrl(u));
              if (altImg && altImg !== thumbnailSrc) {
                setImgBroken(false);
              } else {
                setImgBroken(true);
              }
            }}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          {/* Small icon overlay ONLY if multi-photo or video */}
          {isMultiPhoto && (
            <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-[4px] bg-black/60 backdrop-blur-sm text-white flex items-center justify-center pointer-events-none shadow-xs">
              <Copy size={11} />
            </div>
          )}
          {isVideo && !isMultiPhoto && (
            <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-[4px] bg-black/60 backdrop-blur-sm text-white flex items-center justify-center pointer-events-none shadow-xs">
              <Video size={11} />
            </div>
          )}
        </>
      ) : (
        /* Solid clean placeholder + title text centered for text-only posts */
        <div className="w-full h-full p-2.5 sm:p-3.5 bg-[#111827] text-white flex items-center justify-center text-center transition-transform duration-300 group-hover:scale-105">
          <p className="text-[11px] sm:text-xs font-bold leading-snug line-clamp-3 text-white/95 px-1">
            {post.content || 'Moment'}
          </p>
        </div>
      )}
    </div>
  );
}
