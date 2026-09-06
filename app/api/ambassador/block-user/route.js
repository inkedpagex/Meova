import { NextResponse } from 'next/server';
import { requireAmbassador } from '../dashboard/route';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/ambassador/block-user
 * Tier 2 (full) ambassador blocks or unblocks a user from their college.
 * HARD RULE: Target must be from ambassador's college.
 */
export async function POST(request) {
  try {
    const { user: ambassador, error: authError } = await requireAmbassador('full');
    if (authError) return authError;

    const { target_user_id, action, reason } = await request.json();
    // action: 'block' | 'unblock'

    if (!target_user_id || !['block', 'unblock'].includes(action)) {
      return NextResponse.json({ error: 'target_user_id and action (block|unblock) are required' }, { status: 400 });
    }

    if (target_user_id === ambassador.id) {
      return NextResponse.json({ error: 'You cannot block yourself.' }, { status: 400 });
    }

    // Fetch target — MUST be from ambassador's college
    const { data: target, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, college_id, role, is_ambassador')
      .eq('id', target_user_id)
      .maybeSingle();

    if (fetchErr || !target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // CROSS-COLLEGE GUARD (bypassed for Super Admin)
    if (!ambassador.isAdmin && target.college_id !== ambassador.college_id) {
      return NextResponse.json({ error: 'You can only block users from your own college.' }, { status: 403 });
    }

    // Cannot block admins or other ambassadors
    if (target.role === 'admin' || target.is_ambassador) {
      return NextResponse.json({ error: 'You cannot block admin or ambassador accounts.' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const isBlocking = action === 'block';

    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ is_blocked: isBlocking, updated_at: now })
      .eq('id', target_user_id);

    if (updateErr) {
      console.error('[POST /api/ambassador/block-user]', updateErr.message);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    // Audit log
    await supabaseAdmin.from('ambassador_audit_logs').insert({
      ambassador_id: ambassador.id,
      action: isBlocking ? 'block_user' : 'unblock_user',
      target_id: target_user_id,
      target_type: 'user',
      college_id: ambassador.college_id,
      note: reason?.trim() || null,
      created_at: now,
    });

    return NextResponse.json({
      ok: true,
      message: `${target.full_name || 'User'} has been ${isBlocking ? 'blocked' : 'unblocked'}.`,
    });
  } catch (err) {
    console.error('[POST /api/ambassador/block-user]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
