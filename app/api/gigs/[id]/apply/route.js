import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Gig ID is required' }, { status: 400 });

    const { data: gig, error: fetchErr } = await supabaseAdmin
      .from('gigs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    if (gig.author_id === user.uid) {
      return NextResponse.json({ error: 'You cannot apply to your own gig' }, { status: 400 });
    }

    if (gig.status === 'closed' || gig.status === 'expired') {
      return NextResponse.json({ error: 'This gig is no longer accepting applications' }, { status: 400 });
    }

    // Check duplicate application
    const { data: existingApp } = await supabaseAdmin
      .from('gig_applications')
      .select('*')
      .eq('gig_id', id)
      .eq('applicant_id', user.uid)
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json({ error: 'Already applied to this gig' }, { status: 400 });
    }

    const { pitch } = await request.json().catch(() => ({}));

    // 1. Insert application
    const { error: insertErr } = await supabaseAdmin
      .from('gig_applications')
      .insert({
        gig_id: id,
        applicant_id: user.uid,
        applicant_name: user.full_name || 'Student',
        applicant_photo: user.photo_url || '',
        applicant_username: user.username || '',
        applicant_branch: user.branch || 'Campus',
        pitch: (pitch || '').trim().slice(0, 300),
        status: 'PENDING',
        applied_at: new Date().toISOString(),
      });

    if (insertErr) {
      console.error('[POST /api/gigs/[id]/apply insert error]', insertErr.message);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // 2. Increment applications_count on gig
    const newCount = (gig.applications_count || 0) + 1;
    await supabaseAdmin
      .from('gigs')
      .update({ applications_count: newCount })
      .eq('id', id);

    // Notify author
    if (gig.author_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: gig.author_id,
        sender_id: user.uid,
        title: 'New Gig Application ⚡',
        message: `${user.full_name || 'Someone'} applied to your gig "${gig.title}"`,
        type: 'gig_application',
        gig_id: id,
        read: false,
        created_at: new Date().toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, message: 'Application submitted successfully' });
  } catch (err) {
    console.error('[POST /api/gigs/[id]/apply]', err.message);
    return NextResponse.json({ error: 'Failed to apply to gig' }, { status: 500 });
  }
}
