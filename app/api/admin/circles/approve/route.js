/**
 * POST /api/admin/circles/approve - Admin endpoint to approve or reject host community requests
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { circleId, action, adminNote } = await request.json();
    if (!circleId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid circle ID or action' }, { status: 400 });
    }

    const { data: circle, error: fetchErr } = await supabaseAdmin
      .from('circles')
      .select('id')
      .eq('id', circleId)
      .maybeSingle();

    if (fetchErr || !circle) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'active' : 'rejected';
    const now = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from('circles')
      .update({
        status: newStatus,
        approved_by: user.uid,
        approved_at: now,
        admin_note: adminNote || '',
        updated_at: now,
      })
      .eq('id', circleId);

    if (updateErr) throw new Error(updateErr.message);

    return NextResponse.json({
      success: true,
      circleId,
      status: newStatus,
      message: `Community has been ${newStatus === 'active' ? 'approved & published' : 'rejected'}.`
    });
  } catch (err) {
    console.error('[POST /api/admin/circles/approve]', err.message);
    return NextResponse.json({ error: 'Failed to process admin approval' }, { status: 500 });
  }
}
