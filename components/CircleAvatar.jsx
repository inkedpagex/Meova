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

  // Simple deterministic hash based on name
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gradients = [
    'linear-gradient(135deg, var(--accent-gradient-from) 0%, var(--accent-gradient-to) 100%)',
    'linear-gradient(135deg, var(--ring-gradient-from) 0%, var(--ring-gradient-to) 100%)',
    'linear-gradient(135deg, var(--text-muted) 0%, var(--bg-overlay) 100%)',
    'linear-gradient(135deg, var(--bg-surface) 0%, var(--border-strong) 100%)',
    'linear-gradient(135deg, var(--accent) 0%, var(--bg-overlay) 100%)',
  ];

  const gradient = gradients[Math.abs(hash) % gradients.length];

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: gradient,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: size * 0.38, // Scale font size based on container size
        letterSpacing: '0.02em',
        textShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }}
    >
      {initials}
    </div>
  );
}
