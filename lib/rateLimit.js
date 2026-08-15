/**
 * lib/rateLimit.js
 * Lightweight in-memory sliding-window rate limiter.
 * Uses a Map keyed by identifier (IP + route). Safe for single-instance deployments.
 *
 * Usage:
 *   const { ok, retryAfter } = rateLimit(key, { limit: 5, windowMs: 60_000 });
 *   if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': retryAfter } });
 */

// Map<key, number[]> — stores timestamps of recent requests per key
const store = new Map();

/**
 * @param {string} key        - Unique identifier, e.g. `${ip}:${route}`
 * @param {{ limit: number, windowMs: number }} options
 * @returns {{ ok: boolean, retryAfter?: string }}
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or init timestamp list for this key
  const timestamps = (store.get(key) || []).filter(t => t > windowStart);

  if (timestamps.length >= limit) {
    // Oldest timestamp + window = when the slot frees up
    const oldest = timestamps[0];
    const retryAfterMs = Math.ceil((oldest + windowMs - now) / 1000);
    return { ok: false, retryAfter: String(retryAfterMs) };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  // Cleanup: avoid unbounded memory growth — evict entries older than 2x window
  if (store.size > 10_000) {
    const cutoff = now - windowMs * 2;
    for (const [k, ts] of store.entries()) {
      if (ts[ts.length - 1] < cutoff) store.delete(k);
    }
  }

  return { ok: true };
}

/**
 * Helper: extract the real client IP from Next.js request headers.
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
