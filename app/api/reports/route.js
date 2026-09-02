import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { rateLimit, getClientIp } from '../../../lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`report:${ip}`, { limit: 15, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many reports submitted. Please wait a moment.' }, { status: 429 });
    }

    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, targetId, reason } = await request.json();
    if (!targetId || !reason) {
      return NextResponse.json({ error: 'Target ID and reason required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (type === 'post') {
      // 1. Insert post report
      const { error: reportErr } = await supabaseAdmin
        .from('post_reports')
        .insert({
          post_id: targetId,
          reporter_id: user.uid,
          reason: reason.trim(),
          created_at: now,
        });

      if (reportErr && !reportErr.message.includes('unique')) {
        console.error('[POST /api/reports post error]', reportErr.message);
      }

      // 2. Count distinct reports on this post
      const { count: reportCount } = await supabaseAdmin
        .from('post_reports')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', targetId);

      // 3. Auto-Hide Rule: Hide immediately if 2 or more distinct students report it
      let autoHidden = false;
      if ((reportCount || 0) >= 2) {
        await supabaseAdmin
          .from('posts')
          .update({ is_hidden: true })
          .eq('id', targetId);
        autoHidden = true;
      }

      return NextResponse.json({
        success: true,
        message: 'Report submitted. Thank you for keeping our campus safe.',
        autoHidden,
      });
    }

    if (type === 'user') {
      // Insert user report
      await supabaseAdmin
        .from('user_reports')
        .insert({
          reported_user_id: targetId,
          reporter_id: user.uid,
          reason: reason.trim(),
          created_at: now,
        });

      return NextResponse.json({
        success: true,
        message: 'Student profile reported for campus safety review.',
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/reports]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
