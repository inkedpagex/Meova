/**
 * GET /api/circles/[id]/members - Host & Admin endpoint to fetch joined student roster & revenue metrics
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { id: circleId } = await params;
    if (!circleId) return NextResponse.json({ error: 'Invalid community ID' }, { status: 400 });

    const circleDoc = await adminDb.collection('circles').doc(circleId).get();
    if (!circleDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const circle = circleDoc.data();
    const isHost = circle.host_id === user.uid;
    const isAdmin = user.role === 'admin';

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only host can view member details' }, { status: 403 });
    }

    // Fetch all members for this community
    const membersSnap = await adminDb
      .collection('circle_members')
      .where('circle_id', '==', circleId)
      .get();

    const memberRecords = membersSnap.docs.map(doc => doc.data());

    // Fetch user profiles for all member IDs
    const userIds = Array.from(new Set(memberRecords.map(m => m.user_id).filter(Boolean)));
    const usersMap = {};

    if (userIds.length > 0) {
      // Chunk array into batches of 10 for Firestore 'in' query limitation
      const chunks = [];
      for (let i = 0; i < userIds.length; i += 10) {
        chunks.push(userIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const uSnap = await adminDb
          .collection('users')
          .where('id', 'in', chunk)
          .get();

        uSnap.docs.forEach(d => {
          const uData = d.data();
          usersMap[d.id] = {
            id: d.id,
            full_name: uData.full_name || uData.display_name || uData.name || 'Campus Student',
            photo_url: uData.photo_url || uData.image || '',
            college: uData.college || 'GLA University',
            year: uData.year || 'Student',
            branch: uData.branch || '',
            email: uData.email || '',
          };
        });
      }
    }

    const roster = memberRecords.map(m => {
      const u = usersMap[m.user_id] || {
        id: m.user_id,
        full_name: 'Campus Student',
        photo_url: '',
        college: 'GLA University',
        year: 'Student',
        branch: '',
      };

      return {
        ...m,
        student: u,
      };
    });

    // Sort: Host first, then newest members
    roster.sort((a, b) => (b.joined_at || '').localeCompare(a.joined_at || ''));

    return NextResponse.json({
      success: true,
      circleId,
      circleName: circle.name,
      total_members: roster.length,
      total_sparks_earned: circle.total_sparks_earned || 0,
      roster,
    });
  } catch (err) {
    console.error('[GET /api/circles/[id]/members]', err.message);
    return NextResponse.json({ error: 'Failed to fetch member details' }, { status: 500 });
  }
}

