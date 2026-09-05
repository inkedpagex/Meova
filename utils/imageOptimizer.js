/**
 * imageOptimizer.js
 * High-performance smart Cloudinary & Image URL transformer.
 * Automatically injects WebP/AVIF auto-formatting, adaptive compression,
 * responsive widths, LQIP (Low-Quality Image Placeholders), and video thumbnails.
 */

/**
 * Checks if a given media URL points to a video
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    url.includes('/video/upload/')
  );
}

/**
 * Optimizes an image URL via Cloudinary transformations (f_auto, q_auto, responsive width)
 */
export function optimizeCloudinaryUrl(
  url,
  { width = 800, height = null, quality = 'auto:good', crop = 'limit', gravity = null } = {}
) {
  if (!url || typeof url !== 'string') return '';

  // Only transform Cloudinary image URLs
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  // If already transformed, return as is
  if (url.includes('/f_auto') || url.includes('/q_auto')) {
    return url;
  }

  const parts = url.split('/image/upload/');
  if (parts.length !== 2) return url;

  const transforms = [`f_auto`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);

  const transformString = transforms.join(',');
  return `${parts[0]}/image/upload/${transformString}/${parts[1]}`;
}

/**
 * Generates an ultra-lightweight (~20px wide) heavily blurred LQIP placeholder
 * for instant perceived load with zero network weight.
 */
export function getCloudinaryLqipUrl(url) {
  if (!url || typeof url !== 'string') return '';

  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  const parts = url.split('/image/upload/');
  if (parts.length !== 2) return url;

  // Tiny 20px blurred thumbnail (typically under 800 bytes)
  return `${parts[0]}/image/upload/f_auto,q_auto:eco,w_24,e_blur:1000/${parts[1]}`;
}

/**
 * Auto-extracts a static first-frame thumbnail from a Cloudinary video URL
 * avoiding mounting heavy video decoders when a post is offscreen.
 */
export function getCloudinaryVideoThumbnail(videoUrl, { width = 800 } = {}) {
  if (!videoUrl || typeof videoUrl !== 'string') return '';

  if (videoUrl.includes('res.cloudinary.com') && videoUrl.includes('/video/upload/')) {
    const parts = videoUrl.split('/video/upload/');
    if (parts.length === 2) {
      // Replace video extension with .jpg and add so_0 (seek offset 0s)
      const cleanPath = parts[1].replace(/\.(mp4|webm|mov|m4v)$/i, '.jpg');
      return `${parts[0]}/video/upload/so_0,f_auto,q_auto:good,w_${width}/${cleanPath}`;
    }
  }

  return videoUrl;
}

/**
 * Optimizes video delivery stream using Cloudinary adaptive video compression
 */
export function optimizeCloudinaryVideoUrl(videoUrl, { width = 720, quality = 'auto' } = {}) {
  if (!videoUrl || typeof videoUrl !== 'string') return '';

  if (videoUrl.includes('res.cloudinary.com') && videoUrl.includes('/video/upload/')) {
    if (videoUrl.includes('/vc_auto') || videoUrl.includes('/q_auto')) {
      return videoUrl;
    }
    const parts = videoUrl.split('/video/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/video/upload/vc_auto,q_${quality},f_auto,w_${width}/${parts[1]}`;
    }
  }

  return videoUrl;
}

/**
 * Avatar Optimizer for student avatars (120x120 face focused)
 */
export function optimizeAvatarUrl(url, size = 120) {
  return optimizeCloudinaryUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
  });
}
