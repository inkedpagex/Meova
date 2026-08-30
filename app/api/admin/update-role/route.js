import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { targetUid, role } = await request.json();

  if (!targetUid || !role) {
    return NextResponse.json({ error: 'targetUid and role required' }, { status: 400 });
  }

  const validRoles = ['user', 'verified_host', 'campus_lead', 'admin'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', targetUid)
      .maybeSingle();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRole = profile.role || 'user';
    const now = new Date().toISOString();

    // Update role
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: now })
      .eq('id', targetUid);

    if (updateErr) throw new Error(updateErr.message);

    // Write audit log
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: admin.uid,
      action: 'UPDATE_ROLE',
      target_uid: targetUid,
      old_value: { role: oldRole },
      new_value: { role },
      timestamp: now,
    });

    return NextResponse.json({ ok: true, message: `Role updated to ${role}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
