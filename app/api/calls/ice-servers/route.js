import { NextResponse } from 'next/server';

// Returns ICE servers list — tries Metered.ca API if key is set, else falls back to public OpenRelay TURN
export async function GET() {
  const apiKey = process.env.METERED_API_KEY;

  if (apiKey) {
    // Metered.ca credentials endpoint — try app-specific URL first, then generic
    const meteredUrls = [
      `https://meova.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
      `https://global.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
    ];

    for (const meteredUrl of meteredUrls) {
      try {
        const res = await fetch(meteredUrl, { cache: 'no-store' });
        if (res.ok) {
          const servers = await res.json();
          if (Array.isArray(servers) && servers.length > 0) {
            console.log('[ICE] Metered.ca credentials fetched:', servers.length, 'servers');
            return NextResponse.json({ iceServers: servers });
          }
        }
      } catch {}
    }
    console.warn('[ICE] Metered.ca unreachable, using OpenRelay fallback');
  }

  // Fallback: OpenRelay Project free public TURN servers
  return NextResponse.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
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
