/**
 * CircleAvatar — Always uses a generated geometric icon, never Unsplash photos.
 * Uses DiceBear "shapes" style: clean colorful geometric brand-style icons.
 *
 * Usage:
 *   <CircleAvatar name="Google Dev Club" size={56} radius={12} />
 */

export function circleAvatarUrl(name) {
  // DiceBear shapes: produces a unique colorful geometric logo per seed
  return `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c1f4c5,f4d7c1&shape1Color=ffffff&shape2Color=ffffff&shape3Color=ffffff`;
}

export function CircleAvatar({ name = '', size = 40, radius = '50%', className = '' }) {
  const url = circleAvatarUrl(name);
  return (
    <div
      className={`flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
