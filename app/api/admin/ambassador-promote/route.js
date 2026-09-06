import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/ambassador-promote
 * Promote an ambassador from probation → full tier.
 */
export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { user_id, reason } = await request.json();

  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const { data: profile, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, is_ambassador, ambassador_tier')
    .eq('id', user_id)
    .maybeSingle();

  if (fetchErr || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!profile.is_ambassador) {
    return NextResponse.json({ error: 'User is not an ambassador.' }, { status: 400 });
  }

  if (profile.ambassador_tier === 'full') {
    return NextResponse.json({ error: 'User is already a full ambassador.' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({ ambassador_tier: 'full', updated_at: now })
    .eq('id', user_id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Notify ambassador
  await supabaseAdmin.from('notifications').insert({
    user_id,
    sender_id: admin.uid,
    title: 'Promoted to Full Ambassador!',
    message: `You have successfully completed your probation period and are now a Full Campus Ambassador. You now have access to all ambassador tools.`,
    type: 'sparks',
    read: false,
    created_at: now,
  }).catch(() => {});

  return NextResponse.json({ ok: true, message: `${profile.full_name || 'Ambassador'} promoted to full tier.` });
}
