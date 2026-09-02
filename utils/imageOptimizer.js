/**
 * imageOptimizer.js
 * High-performance smart Cloudinary & Image URL transformer.
 * Automatically injects WebP/AVIF auto-formatting, adaptive compression, and responsive widths.
 */

export function optimizeCloudinaryUrl(url, { width = 800, height = null, quality = 'auto:good', crop = 'limit', gravity = null } = {}) {
  if (!url || typeof url !== 'string') return '';

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  // If already transformed, don't duplicate
  if (url.includes('/f_auto,') || url.includes('/q_auto')) {
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
 * Avatar Optimizer for student avatars (100x100 face focused)
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
