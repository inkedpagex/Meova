import { NextResponse } from 'next/server';

// Returns ICE servers list — tries Metered.ca API if key is set (with 3s timeout), else falls back to public STUN only
export async function GET() {
  const apiKey = process.env.METERED_API_KEY;

  if (apiKey) {
    // Try global first (most reliable), then custom subdomain
    const meteredUrls = [
      `https://global.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
      `https://meova.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
    ];

    for (const meteredUrl of meteredUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(meteredUrl, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const servers = await res.json();
          if (Array.isArray(servers) && servers.length > 0) {
            // Always include Google STUN alongside Metered TURN for fastest candidate gathering
            return NextResponse.json({
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                ...servers,
              ],
            });
          }
        }
      } catch {}
    }
  }

  // Fallback: STUN-only (no TURN) — works on same network, may fail behind strict NAT
  return NextResponse.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.services.mozilla.com:3478' },
    ],
  });
}
