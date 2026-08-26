import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/getAdminUser';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { groups } = await request.json();
    if (!groups) return NextResponse.json({ error: 'Groups payload is required' }, { status: 400 });

    const userRef = adminDb.collection('users').doc(user.uid);
    
    await userRef.set({ joinedGroups: groups }, { merge: true });

    return NextResponse.json({ ok: true, groups });
  } catch (err) {
    console.error(`[POST /api/users/groups]`, err.message);
    return NextResponse.json({ error: 'Failed to update groups' }, { status: 500 });
  }
}

