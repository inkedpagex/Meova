import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (!adminDb) {
      return NextResponse.json({ bookings: [] });
    }

    const snap = await adminDb.collection('bookings').get();
    const bookings = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
