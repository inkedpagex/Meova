import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  const currentUser = await requireAuth();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const snap = await adminDb.collection('users').limit(50).get();
    const users = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => u.id !== currentUser.uid); // exclude self

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
