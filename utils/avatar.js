/**
 * Avatar resolution for Meetify
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

  // 1. Uploaded profile photo
  if (user.photo_url) return user.photo_url;

  // 2. Cartoon fallback
  return getCartoonAvatar(user.full_name || user.id || 'user');
}

/**
 * Dicebear cartoon avatar — safe default when we only have a seed string.
 * Use this when you don't have a full user object.
 */
export function getCartoonAvatar(seed) {
  const cleanSeed = (seed || 'default').toString();
  const hash = hashCode(cleanSeed);
  const grad = gradients[hash % gradients.length];

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${grad.from}"/>
        <stop offset="100%" stop-color="${grad.to}"/>
      </linearGradient>
      <linearGradient id="sil-${hash}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="white" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="white" stop-opacity="0.75"/>
      </linearGradient>
      <filter id="shadow-${hash}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.15"/>
      </filter>
    </defs>
    <rect width="100" height="100" fill="url(%23grad-${hash})"/>
    <g filter="url(%23shadow-${hash})">
      <circle cx="50" cy="38" r="16" fill="url(%23sil-${hash})"/>
      <path d="M 22 84 C 22 66, 32 58, 50 58 C 68 58, 78 66, 78 84" fill="url(%23sil-${hash})"/>
    </g>
  </svg>`;
}

/**
 * Legacy shim — use getUserAvatarUrl(user) instead when you have the object.
 * Only used when all you have is a name string.
 */
export function getRealAvatarUrl(seed) {
  return getCartoonAvatar(seed);
}
