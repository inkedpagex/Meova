import { NextResponse } from 'next/server';
import { requireHostOrAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  const host = await requireHostOrAdmin();
  if (!host) {
    return NextResponse.json({ error: 'Unauthorized. Host privileges required.' }, { status: 403 });
  }

  try {
    const { targetUid, isSuspended = true, reason = 'Fake account / Community violations' } = await request.json();

    if (!targetUid || typeof isSuspended !== 'boolean') {
      return NextResponse.json({ error: 'targetUid and isSuspended boolean required' }, { status: 400 });
    }

    if (isSuspended && (!reason || reason.trim().length < 3)) {
      return NextResponse.json({ error: 'Please provide a valid suspension reason (at least 3 characters).' }, { status: 400 });
    }

    // 1. Fetch target profile
    const { data: targetProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', targetUid)
      .maybeSingle();

    if (profileErr || !targetProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 2. SECURITY GUARDRAILS: Cannot suspend self, Admins, or other Hosts
    if (targetUid === host.uid) {
      return NextResponse.json({ error: 'Cannot suspend your own account.' }, { status: 400 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const targetEmail = (targetProfile.email || '').toLowerCase();
    const targetRole = targetProfile.role || 'user';

    if (
      targetRole === 'admin' ||
      targetEmail === 'chirag2006chak@gmail.com' ||
      adminEmails.includes(targetEmail)
    ) {
      return NextResponse.json({ error: 'Security Policy: Administrator accounts cannot be suspended.' }, { status: 403 });
    }

    if (host.role !== 'admin' && (targetRole === 'verified_host' || targetRole === 'campus_lead')) {
      return NextResponse.json({ error: 'Security Policy: Hosts cannot suspend other Campus Hosts. Only Administrators can manage Hosts.' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // 3. Update target user profile
    const updatePayload = {
      is_blocked: isSuspended,
      status: isSuspended ? 'blocked' : 'active',
      updated_at: now,
    };

    // If suspension columns exist, populate them
    try {
      updatePayload.is_suspended = isSuspended;
      updatePayload.suspended_reason = isSuspended ? reason.trim() : null;
      updatePayload.suspended_by = isSuspended ? host.uid : null;
      updatePayload.suspended_at = isSuspended ? now : null;
    } catch {}

    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', targetUid);

    if (updateErr) {
      // If error due to missing columns, update standard is_blocked/status
      await supabaseAdmin
        .from('profiles')
        .update({
          is_blocked: isSuspended,
          status: isSuspended ? 'blocked' : 'active',
          updated_at: now,
        })
        .eq('id', targetUid);
    }

    // 4. Cascade hide/unhide posts
    try {
      await supabaseAdmin
        .from('posts')
        .update({ is_hidden: isSuspended })
        .eq('user_id', targetUid);
    } catch (e) {
      console.warn('[Host Suspend User] cascade hide posts warning:', e?.message);
    }

    // 5. Audit Log (guaranteed table)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: host.uid,
        action: isSuspended ? 'HOST_SUSPEND_USER' : 'HOST_UNSUSPEND_USER',
        target_uid: targetUid,
        old_value: {
          status: targetProfile.status,
          fullName: targetProfile.full_name,
          email: targetProfile.email,
          branch: targetProfile.branch,
        },
        new_value: {
          isSuspended,
          reason: reason.trim(),
          moderatedBy: host.uid,
          hostRole: host.role,
        },
        timestamp: now,
      });
    } catch (err) {
      console.warn('[Host Suspend User] audit_logs warning:', err?.message);
    }

    // 6. Log in host_moderation_logs (if migrated)
    try {
      await supabaseAdmin.from('host_moderation_logs').insert({
        host_id: host.uid,
        action_type: isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
        target_type: 'profile',
        target_id: targetUid,
        target_user_id: targetUid,
        reason: reason.trim(),
        metadata: {
          targetName: targetProfile.full_name || 'Student',
          targetEmail: targetProfile.email,
        },
        created_at: now,
      });
    } catch (e) {
      // Table might not be migrated yet, fallback already logged in audit_logs
    }

    return NextResponse.json({
      ok: true,
      message: isSuspended
        ? `Student (${targetProfile.full_name || 'User'}) has been suspended from campus. Reason: ${reason.trim()}`
        : `Student (${targetProfile.full_name || 'User'}) has been reinstated.`
    });
  } catch (error) {
    console.error('[POST /api/host/suspend-user]', error);
    return NextResponse.json({ error: error.message || 'Failed to update suspension status' }, { status: 500 });
  }
}
