import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const { targetUid, isBlocked } = await request.json();

    if (!targetUid || typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'targetUid and boolean isBlocked required' }, { status: 400 });
    }

    const { data: targetProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', targetUid)
      .maybeSingle();

    if (profileErr || !targetProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const targetEmail = (targetProfile.email || '').toLowerCase();

    if (
      targetProfile.role === 'admin' ||
      targetUid === admin.uid ||
      targetEmail === 'chirag2006chak@gmail.com' ||
      adminEmails.includes(targetEmail)
    ) {
      return NextResponse.json({ error: 'Administrator accounts cannot be blocked.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update profile
    await supabaseAdmin
      .from('profiles')
      .update({
        is_blocked: isBlocked,
        status: isBlocked ? 'blocked' : 'active',
        updated_at: now,
      })
      .eq('id', targetUid);

    // Cascade block to posts and gigs
    await Promise.all([
      supabaseAdmin
        .from('posts')
        .update({ is_hidden: isBlocked })
        .eq('author_id', targetUid),
      supabaseAdmin
        .from('gigs')
        .update({ is_hidden: isBlocked })
        .eq('author_id', targetUid),
    ]);

    // Write audit log
    await supabaseAdmin.from('audit_logs').insert({
      admin_uid: admin.uid,
      action: isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      target_id: targetUid,
      created_at: now,
    });

    return NextResponse.json({
      ok: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully.`
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
