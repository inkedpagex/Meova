/**
 * GET /api/admin/circles/list - Returns all community creation requests for admin review
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const user = await getUserWithRole();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const snap = await adminDb.collection('circles').get();
    const circles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch secret links for admin review
    const linksSnap = await adminDb.collection('circle_links').get();
    const linksMap = {};
    linksSnap.docs.forEach(d => {
      linksMap[d.id] = d.data().invite_link;
    });

    const enriched = circles.map(c => ({
      ...c,
      invite_link: linksMap[c.id] || c.whatsapp_link || '',
    }));

    // Sort: Pending first, then newest
    enriched.sort((a, b) => {
      if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
      if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    return NextResponse.json({
      success: true,
      circles: enriched,
    });
  } catch (err) {
    console.error('[GET /api/admin/circles/list]', err.message);
    return NextResponse.json({ error: 'Failed to list circles for admin' }, { status: 500 });
  }
}
