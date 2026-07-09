import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const snap = await adminDb.collection('withdrawals').get();
    const withdrawals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));

    return NextResponse.json({ withdrawals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
