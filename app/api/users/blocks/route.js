import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  const currentUser = await requireAuth();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const blocksSnap = await adminDb.collection('blocks')
      .where('blocker', '==', currentUser.uid)
      .get();
    
    const blocksSnap2 = await adminDb.collection('blocks')
      .where('blocked', '==', currentUser.uid)
      .get();
      
    const blockedUids = new Set([
      ...blocksSnap.docs.map(doc => doc.data().blocked),
      ...blocksSnap2.docs.map(doc => doc.data().blocker)
    ]);

    return NextResponse.json({ blocks: Array.from(blockedUids) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
