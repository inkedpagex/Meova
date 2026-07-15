/**
 * Avatar resolution for meetifyy
 *
 * Priority order:
 *  1. User's uploaded photo_url
 *  2. Instagram DP (via unavatar.io which proxies Instagram profile pics)
 *  3. Cartoon fallback (dicebear adventurer) — NOT a real stranger's photo
 */

/**
 * Get avatar for a full user object.
 * Pass the entire user/profile object whenever possible.
 */
export function getUserAvatarUrl(user) {
  if (!user) return getCartoonAvatar('default');

  // 1. Uploaded profile photo
  if (user.photo_url) return user.photo_url;

  // 2. Instagram DP — unavatar.io proxies Instagram profile images
  if (user.instagram) {
    const handle = String(user.instagram).replace('@', '').trim();
    if (handle) {
      return `https://unavatar.io/instagram/${handle}`;
    }
  }

  // 3. Cartoon avatar fallback (deterministic, fun, not a real person)
  return getCartoonAvatar(user.full_name || user.email || user.id || 'user');
}

/**
 * Dicebear cartoon avatar — safe default when we only have a seed string.
 * Use this when you don't have a full user object.
 */
export function getCartoonAvatar(seed) {
  const s = encodeURIComponent(String(seed || 'user').toLowerCase());
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${s}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Legacy shim — use getUserAvatarUrl(user) instead when you have the object.
 * Only used when all you have is a name string.
 */
export function getRealAvatarUrl(seed) {
  return getCartoonAvatar(seed);
}
