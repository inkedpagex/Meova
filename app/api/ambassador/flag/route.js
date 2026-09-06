import { NextResponse } from 'next/server';
import { requireAmbassador } from '../dashboard/route';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/ambassador/flag
 * Tier 1+ ambassador flags a user or post for admin review.
 * Does NOT delete/block — only creates a report entry.
 */
export async function POST(request) {
  try {
    const { user: ambassador, error: authError } = await requireAmbassador('probation');
    if (authError) return authError;

    const { target_id, target_type, reason } = await request.json();
    // target_type: 'user' | 'post'

    if (!target_id || !['user', 'post'].includes(target_type)) {
      return NextResponse.json({ error: 'target_id and target_type (user|post) are required' }, { status: 400 });
    }

    if (!reason?.trim() || reason.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide a reason (at least 10 characters)' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // If flagging a user, verify they're from ambassador's college
    if (target_type === 'user') {
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('college_id')
        .eq('id', target_id)
        .maybeSingle();

      if (targetProfile && targetProfile.college_id !== ambassador.college_id) {
        return NextResponse.json({ error: 'You can only flag users from your own college.' }, { status: 403 });
      }
    }

    // Create report
    await supabaseAdmin.from('user_reports').insert({
      reported_user_id: target_type === 'user' ? target_id : null,
      reporter_id: ambassador.id,
      reason: `[Ambassador Flag] ${reason.trim()}`,
      created_at: now,
    }).catch(() => {}); // non-critical

    // Audit log
    await supabaseAdmin.from('ambassador_audit_logs').insert({
      ambassador_id: ambassador.id,
      action: target_type === 'user' ? 'flag_user' : 'flag_post',
      target_id,
      target_type,
      college_id: ambassador.college_id,
      note: reason.trim(),
      created_at: now,
    });

    return NextResponse.json({ ok: true, message: 'Flag submitted for admin review.' });
  } catch (err) {
    console.error('[POST /api/ambassador/flag]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
