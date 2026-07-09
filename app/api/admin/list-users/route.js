import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const snap = await adminDb.collection('users').get();
    const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
