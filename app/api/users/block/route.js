import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  const currentUser = await requireAuth();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetUid } = await request.json();
    if (!targetUid || typeof targetUid !== 'string') {
      return NextResponse.json({ error: 'targetUid is required' }, { status: 400 });
    }
    if (targetUid === currentUser.uid) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('blocks')
      .upsert({
        blocker_id: currentUser.uid,
        blocked_id: targetUid,
        created_at: new Date().toISOString()
      }, { onConflict: 'blocker_id,blocked_id' });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error blocking user:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
