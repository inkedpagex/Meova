import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { fetchUsersAdmin } from '@/lib/firebaseAdminQueries';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  const currentUser = await requireAuth();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await fetchUsersAdmin(50);
    
    // Fetch blocks
    const blocksSnap = await adminDb.collection('blocks')
      .where('blocker', '==', currentUser.uid)
      .get();
    const blockedByMe = new Set(blocksSnap.docs.map(doc => doc.data().blocked));

    const blocksSnap2 = await adminDb.collection('blocks')
      .where('blocked', '==', currentUser.uid)
      .get();
    const blockedMe = new Set(blocksSnap2.docs.map(doc => doc.data().blocker));

    const filteredUsers = users.filter(u => 
      u.id !== currentUser.uid && 
      !blockedByMe.has(u.id) && 
      !blockedMe.has(u.id)
    );

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
