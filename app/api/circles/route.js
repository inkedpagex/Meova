import { NextResponse } from 'next/server';
import { fetchCirclesAdmin } from '@/lib/supabaseQueries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const circles = await fetchCirclesAdmin();
    return NextResponse.json(
      { circles: circles || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ circles: [] });
  }
}
