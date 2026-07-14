/**
 * CircleAvatar — Minimalist Apple-style initials.
 * Uses a pure dark background with clean white initials.
 *
 * Usage:
 *   <CircleAvatar name="Google Dev Club" size={56} radius={12} />
 */

export function CircleAvatar({ name = '', size = 40, radius = '50%', className = '' }) {
  // Extract up to 2 initials (e.g., "Coding Club" -> "CC")
  const safeName = name || 'Circle';
  const initials = safeName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: '#111111', // Solid dark premium background
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: size * 0.4, // Scale font size based on container size
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}
