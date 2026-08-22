/**
 * GET  /api/experiences       — List all experiences
 * POST /api/experiences       — Create a new experience (host only)
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../lib/getAdminUser';
import { adminDb } from '../../../lib/firebaseAdmin';
import { fetchExperiencesAdmin } from '../../../lib/firebaseAdminQueries';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const experiences = await fetchExperiencesAdmin(limit);
    return NextResponse.json({ experiences });
  } catch (err) {
    console.error('[GET /api/experiences]', err.message);
    return NextResponse.json({ experiences: [] });
  }
}

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const body = await request.json();
    const { title, category, price, duration, location, days, slots } = body;

    if (!title || !category || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const exp = {
      title,
      category,
      price: Number(price) || 0,
      duration: Number(duration) || 45,
      location,
      days: days || [],
      slots: slots || [],
      hostId: user.uid,
      rating: 5.0,
      reviewsCount: 0,
      active: true,
      tags: [category.toLowerCase()],
      created_at: new Date().toISOString(),
    };

    const ref = await adminDb.collection('experiences').add(exp);
    const created = { id: ref.id, ...exp };

    // Sync to Algolia for instant search (fire-and-forget, non-blocking)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/algolia/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'experience', data: created }),
    }).catch(() => {}); // Non-fatal

    return NextResponse.json({ experience: created });
  } catch (err) {
    console.error('[POST /api/experiences]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
