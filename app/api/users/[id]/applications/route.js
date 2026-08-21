/**
 * GET /api/users/[id]/applications
 * Returns all gigs the given user has applied to, enriched with gig title.
 */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserWithRole } from '@/lib/getAdminUser';

export async function GET(request, { params }) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ applications: [] });

    const { id } = await params;

    // Users can only see their own applications
    if (id !== user.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Query all gigs, then find application sub-docs for this user
    // Using collectionGroup to query all 'applications' sub-collections at once (1 read)
    const snap = await adminDb
      .collectionGroup('applications')
      .where('applicantId', '==', id)
      .orderBy('appliedAt', 'desc')
      .get();

    if (snap.empty) return NextResponse.json({ applications: [] });

    // Enrich with gig title (batch read parent gig docs)
    const gigIds = [...new Set(snap.docs.map(doc => doc.ref.parent.parent.id))];
    const gigSnaps = await Promise.all(gigIds.map(gid => adminDb.collection('gigs').doc(gid).get()));
    const gigMap = {};
    gigSnaps.forEach(gs => { if (gs.exists) gigMap[gs.id] = gs.data(); });

    const applications = snap.docs.map(doc => {
      const gigId = doc.ref.parent.parent.id;
      const gig = gigMap[gigId] || {};
      return {
        id: doc.id,
        gigId,
        gigTitle: gig.title || 'Gig',
        gigBudget: gig.budget || '0',
        ...doc.data(),
      };
    });

    return NextResponse.json({ applications });
  } catch (err) {
    console.error('[GET /api/users/[id]/applications]', err.message);
    return NextResponse.json({ applications: [] });
  }
}
