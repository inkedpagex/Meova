import { NextResponse } from 'next/server';

// Returns ICE servers list — tries Metered.ca API if key is set (with fast 1.5s timeout), else falls back to robust public STUN/TURN
export async function GET() {
  const apiKey = process.env.METERED_API_KEY;

  if (apiKey) {
    const meteredUrls = [
      `https://meova.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
      `https://global.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
    ];

    for (const meteredUrl of meteredUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(meteredUrl, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const servers = await res.json();
          if (Array.isArray(servers) && servers.length > 0) {
            return NextResponse.json({ iceServers: servers });
          }
        }
      } catch {}
    }
  }

  // Fallback: Comprehensive global STUN & OpenRelay TURN
  return NextResponse.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.services.mozilla.com:3478' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:80?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  });
}
