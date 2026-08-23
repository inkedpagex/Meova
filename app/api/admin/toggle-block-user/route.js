import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const { targetUid, isBlocked } = await request.json();

    if (!targetUid || typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'targetUid and boolean isBlocked required' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(targetUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User doc not found' }, { status: 404 });
    }

    const targetData = userSnap.data() || {};
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const targetEmail = (targetData.email || '').toLowerCase();

    if (
      targetData.role === 'admin' ||
      targetUid === admin.uid ||
      targetEmail === 'chirag2006chak@gmail.com' ||
      adminEmails.includes(targetEmail)
    ) {
      return NextResponse.json({ error: 'Administrator accounts cannot be blocked.' }, { status: 400 });
    }

    await userRef.update({
      isBlocked,
      status: isBlocked ? 'blocked' : 'active',
      updatedAt: new Date().toISOString(),
    });

    // Write audit log
    await adminDb.collection('audit_logs').add({
      admin_id:   admin.uid,
      action:     isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      target_uid: targetUid,
      timestamp:  new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully.`
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
