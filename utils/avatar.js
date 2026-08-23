/**
 * Avatar resolution for Meetuply
 *
 * Priority order:
 *  1. User's custom/uploaded photo_url
 *  2. Cartoon fallback (dicebear adventurer)
 */

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const gradients = [
  { from: '%236366f1', to: '%23a855f7' }, // Indigo -> Purple
  { from: '%23ec4899', to: '%23f43f5e' }, // Pink -> Rose
  { from: '%233b82f6', to: '%2306b6d4' }, // Blue -> Cyan
  { from: '%23f97316', to: '%23eab308' }, // Orange -> Yellow
  { from: '%2310b981', to: '%23059669' }, // Emerald -> Green
  { from: '%238b5cf6', to: '%23ec4899' }, // Violet -> Pink
  { from: '%233b82f6', to: '%236366f1' }, // Blue -> Indigo
];

/**
 * Get avatar for a full user object.
 * Pass the entire user/profile object whenever possible.
 */
export function getUserAvatarUrl(user) {
  if (!user) return getCartoonAvatar('default');

  // Check all possible photo_url properties across Firebase Auth, Firestore, and session JWTs
  const photo = user.photo_url || user.photoURL || user.picture || user.avatar || user.photo;
  if (
    photo &&
    typeof photo === 'string' &&
    photo.trim() !== '' &&
    photo !== 'undefined' &&
    photo !== 'null' &&
    photo !== '[object Object]'
  ) {
    // Upgrade Google OAuth avatars from low-res thumbnail (s96-c / s50) to crisp s400-c HD quality
    if (photo.includes('googleusercontent.com')) {
      if (photo.includes('=')) {
        return photo.replace(/=[^/]+$/, '=s400-c');
      } else {
        return `${photo}=s400-c`;
      }
    }
    return photo;
  }

  // Cartoon fallback
  return getCartoonAvatar(user.full_name || user.displayName || user.name || user.id || 'user');
}

/**
 * Dicebear cartoon avatar — safe default when we only have a seed string.
 * Use this when you don't have a full user object.
 */
export function getCartoonAvatar(seed) {
  const cleanSeed = encodeURIComponent((seed || 'default').toString());
  // Use public Dicebear Adventurer SVG avatar API
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanSeed}`;
}

/**
 * Legacy shim — use getUserAvatarUrl(user) instead when you have the object.
 * Only used when all you have is a name string.
 */
export function getRealAvatarUrl(seed) {
  return getCartoonAvatar(seed);
}
