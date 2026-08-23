import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const DEFAULT_GIGS = [
  {
    title: 'Figma UI Designer for Campus App',
    company: 'Meetuply Team',
    category: 'Design',
    budget: '500',
    duration: '3 Days',
    type: 'FREELANCE',
    desc: 'Looking for a talented student designer to create sleek UI mockups for our campus community events app.',
    createdAt: new Date(Date.now() - 10000).toISOString(),
    applicationsCount: 0
  },
  {
    title: 'Next.js Frontend Bug Fixes',
    company: 'Coding Club',
    category: 'Development',
    budget: '750',
    duration: '1 Week',
    type: 'PROJECT',
    desc: 'Help integrate Tailwind CSS components and optimize client page load speed for the annual tech fest website.',
    createdAt: new Date(Date.now() - 20000).toISOString(),
    applicationsCount: 0
  },
  {
    title: 'Campus Fest Poster & Reel Creation',
    company: 'Media Circle',
    category: 'Marketing',
    budget: '400',
    duration: '2 Days',
    type: 'CREATIVE',
    desc: 'Create 3 Instagram reels and event posters for the upcoming inter-college cultural fest.',
    createdAt: new Date(Date.now() - 30000).toISOString(),
    applicationsCount: 0
  }
];

export async function GET(request) {
  try {
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const batch = adminDb.batch();
    const gigsRef = adminDb.collection('gigs');

    for (const gig of DEFAULT_GIGS) {
      const docRef = gigsRef.doc();
      batch.set(docRef, gig);
    }

    await batch.commit();

    return NextResponse.json({ ok: true, message: 'Successfully seeded mock gigs to Firestore.' });
  } catch (err) {
    console.error('[GET /api/admin/seed-gigs]', err.message);
    return NextResponse.json({ error: 'Failed to seed gigs' }, { status: 500 });
  }
}
