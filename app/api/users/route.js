import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { fetchUsersAdmin } from '@/lib/firebaseAdminQueries';

export async function GET() {
  const currentUser = await requireAuth();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await fetchUsersAdmin(50);
    const filteredUsers = users.filter(u => u.id !== currentUser.uid);

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
