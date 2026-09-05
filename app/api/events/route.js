import { NextResponse } from 'next/server';
import { fetchUpcomingEventsAdmin } from '@/lib/supabaseQueries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await fetchUpcomingEventsAdmin(30);
    return NextResponse.json(
      { events: events || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('[GET /api/events]', err.message);
    return NextResponse.json({ events: [] });
  }
}
