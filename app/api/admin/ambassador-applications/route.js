import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { nanoid } from 'nanoid';

function generateReferralCode() {
  // 8-char alphanumeric referral code e.g. "AMB4X7K2"
  return 'AMB' + nanoid(5).toUpperCase().replace(/[^A-Z0-9]/g, 'X').substring(0, 5);
}

/**
 * GET /api/admin/ambassador-applications
 * List ambassador applications, filtered by status.
 */
export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('ambassador_applications')
    .select(`
      id, user_id, college_id, college_name, full_name, email, phone,
      year, branch, why_ambassador, instagram_handle, linkedin_url,
      meeting_locations, status, admin_note, created_at, shortlisted_at, approved_at
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('[GET /api/admin/ambassador-applications]', error.message);
    return NextResponse.json({ applications: [], total: 0 });
  }

  // Enrich with profile data
  const userIds = (data || []).map(a => a.user_id).filter(Boolean);
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, photo_url, username, tier')
    .in('id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const enriched = (data || []).map(app => ({
    ...app,
    profile: profileMap.get(app.user_id) || null,
  }));

  return NextResponse.json({ applications: enriched, total: count || 0, page });
}

/**
 * PATCH /api/admin/ambassador-applications
 * Update application status: shortlist | approve | reject | revoke
 */
export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { application_id, action, admin_note, college_id } = await request.json();

  if (!application_id || !action) {
    return NextResponse.json({ error: 'application_id and action required' }, { status: 400 });
  }

  const validActions = ['shortlist', 'approve', 'reject', 'revoke'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: `Invalid action. Use: ${validActions.join(', ')}` }, { status: 400 });
  }

  const { data: app, error: fetchErr } = await supabaseAdmin
    .from('ambassador_applications')
    .select('*')
    .eq('id', application_id)
    .maybeSingle();

  if (fetchErr || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updates = { status: action === 'shortlist' ? 'shortlisted' : action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revoked', admin_note: admin_note?.trim() || null };

  if (action === 'shortlist') {
    updates.shortlisted_at = now;
    updates.shortlisted_by = admin.uid;
  }

  if (action === 'approve') {
    updates.approved_at = now;
    updates.approved_by = admin.uid;
    if (college_id) updates.college_id = college_id;
  }

  await supabaseAdmin.from('ambassador_applications').update(updates).eq('id', application_id);

  // On approve: set profile as ambassador + generate referral code
  if (action === 'approve') {
    let referralCode;
    // Generate unique referral code
    for (let i = 0; i < 10; i++) {
      const code = generateReferralCode();
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle();
      if (!existing) { referralCode = code; break; }
    }

    const profileUpdates = {
      is_ambassador: true,
      ambassador_tier: 'probation',
      updated_at: now,
    };
    if (referralCode) profileUpdates.referral_code = referralCode;
    if (college_id || app.college_id) profileUpdates.college_id = college_id || app.college_id;

    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', app.user_id);

    if (profileErr) {
      console.error('[PATCH /api/admin/ambassador-applications approve profile]', profileErr.message);
    }

    // Notify user
    await supabaseAdmin.from('notifications').insert({
      user_id: app.user_id,
      sender_id: admin.uid,
      title: 'You are now a Campus Ambassador!',
      message: `Congratulations! Your ambassador application has been approved. Your referral code is: ${referralCode || 'N/A'}. Log in to access your ambassador dashboard.`,
      type: 'sparks',
      read: false,
      created_at: now,
    }).catch(() => {});

    return NextResponse.json({ ok: true, action, referralCode });
  }

  // On revoke: remove ambassador status
  if (action === 'revoke') {
    await supabaseAdmin
      .from('profiles')
      .update({ is_ambassador: false, ambassador_tier: 'none', updated_at: now })
      .eq('id', app.user_id);
  }

  return NextResponse.json({ ok: true, action });
}
