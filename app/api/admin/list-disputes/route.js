import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const disputesSnap = await adminDb.collection('bookings')
      .where('status', '==', 'Disputed')
      .get();
    
    const disputes = disputesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
    }));

    return NextResponse.json({ disputes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
