/**
 * POST /api/admin/circles/approve - Admin endpoint to approve or reject host community requests
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { circleId, action, adminNote } = await request.json();
    if (!circleId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid circle ID or action' }, { status: 400 });
    }

    const circleRef = adminDb.collection('circles').doc(circleId);
    const circleDoc = await circleRef.get();

    if (!circleDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'active' : 'rejected';

    await circleRef.update({
      status: newStatus,
      approved_by: user.uid,
      approved_at: new Date().toISOString(),
      admin_note: adminNote || '',
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      circleId,
      status: newStatus,
      message: `Community has been ${newStatus === 'active' ? 'approved & published' : 'rejected'}.`
    });
  } catch (err) {
    console.error('[POST /api/admin/circles/approve]', err.message);
    return NextResponse.json({ error: 'Failed to process admin approval' }, { status: 500 });
  }
}

