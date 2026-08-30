import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { fetchUsersAdmin } from '@/lib/firebaseAdminQueries';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const currentUser = await requireAuth();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await fetchUsersAdmin(100);

    const { data: blocksByMe } = await supabaseAdmin
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', currentUser.uid);

    const { data: blocksMe } = await supabaseAdmin
      .from('blocks')
      .select('blocker_id')
      .eq('blocked_id', currentUser.uid);

    const blockedByMe = new Set((blocksByMe || []).map(b => b.blocked_id));
    const blockedMe = new Set((blocksMe || []).map(b => b.blocker_id));

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
