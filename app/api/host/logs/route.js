import { NextResponse } from 'next/server';
import { requireHostOrAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request) {
  const host = await requireHostOrAdmin();
  if (!host) {
    return NextResponse.json({ error: 'Unauthorized. Host privileges required.' }, { status: 403 });
  }

  try {
    // 1. Try fetching from host_moderation_logs
    const { data: hostLogs, error: logErr } = await supabaseAdmin
      .from('host_moderation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!logErr && hostLogs && hostLogs.length > 0) {
      return NextResponse.json({ success: true, logs: hostLogs });
    }

    // 2. Fallback to audit_logs where action starts with HOST_
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .or('action.ilike.HOST_%,action.ilike.%ROLE%')
      .order('timestamp', { ascending: false })
      .limit(50);

    const { data: auditLogs } = await query;

    const formatted = (auditLogs || []).map(log => ({
      id: log.id,
      host_id: log.admin_id,
      action_type: log.action,
      target_type: log.action?.includes('POST') ? 'post' : 'user',
      target_id: log.target_uid || '',
      reason: log.new_value?.reason || 'Administrative action',
      metadata: {
        targetName: log.old_value?.fullName || log.old_value?.authorName || 'Student',
        ...(log.old_value || {}),
        ...(log.new_value || {}),
      },
      created_at: log.timestamp,
    }));

    return NextResponse.json({ success: true, logs: formatted });
  } catch (error) {
    console.error('[GET /api/host/logs]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
