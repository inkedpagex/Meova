import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { targetUid, role } = await request.json();

  if (!targetUid || !role) {
    return NextResponse.json({ error: 'targetUid and role required' }, { status: 400 });
  }

  const validRoles = ['user', 'verified_host', 'campus_lead', 'admin'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const userRef = adminDb.collection('users').doc(targetUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User doc not found' }, { status: 404 });
    }

    const oldData = userSnap.data();
    const oldRole = oldData.role || 'user';

    await userRef.update({
      role,
      updatedAt: new Date().toISOString(),
    });

    // Write audit log
    await adminDb.collection('audit_logs').add({
      admin_id:   admin.uid,
      action:     'UPDATE_ROLE',
      target_uid: targetUid,
      old_value:  oldRole,
      new_value:  role,
      timestamp:  new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: `Role updated to ${role}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
