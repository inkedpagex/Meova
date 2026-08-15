/**
 * GET  /api/experiences       — List all experiences
 * POST /api/experiences       — Create a new experience (host only)
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../lib/getAdminUser';
import { adminDb } from '../../../lib/firebaseAdmin';
import { fetchExperiencesAdmin } from '../../../lib/firebaseAdminQueries';

export const revalidate = 30;

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
    return NextResponse.json({ experience: { id: ref.id, ...exp } });
  } catch (err) {
    console.error('[POST /api/experiences]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
