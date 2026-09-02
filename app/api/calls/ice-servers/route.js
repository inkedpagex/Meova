import { NextResponse } from 'next/server';

// Returns ICE servers list — tries Metered.ca API if key is set, else falls back to public OpenRelay TURN
export async function GET() {
  const apiKey = process.env.METERED_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(
        `https://meova.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const servers = await res.json();
        return NextResponse.json({ iceServers: servers });
      }
    } catch (e) {
      console.warn('[ICE] Metered API failed, falling back to public TURN:', e.message);
    }
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
