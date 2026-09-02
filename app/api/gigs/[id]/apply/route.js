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

    const hostId = gig.host_id || gig.author_id;
    if (hostId === user.uid) {
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

    // Match exact Supabase public.gig_applications schema:
    // ['id', 'gig_id', 'applicant_id', 'applicant_name', 'applicant_photo', 'pitch', 'status', 'created_at']
    const { error: insertErr } = await supabaseAdmin
      .from('gig_applications')
      .insert({
        gig_id: id,
        applicant_id: user.uid,
        applicant_name: user.full_name || 'Campus Student',
        applicant_photo: user.photo_url || '',
        pitch: (pitch || '').trim().slice(0, 300),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (insertErr) {
      console.error('[POST /api/gigs/[id]/apply insert error]', insertErr.message);
      return NextResponse.json({ error: `Failed to submit application: ${insertErr.message}` }, { status: 500 });
    }

    // Increment applications_count on gig
    const newCount = (gig.applications_count || 0) + 1;
    await supabaseAdmin
      .from('gigs')
      .update({ applications_count: newCount })
      .eq('id', id);

    // Notify gig host
    if (hostId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: hostId,
        sender_id: user.uid,
        title: 'New Gig Application',
        message: `${user.full_name || 'Someone'} applied to your gig "${gig.title}".`,
        type: 'gig_application',
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

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Gig ID is required' }, { status: 400 });

    const { data: existingApp } = await supabaseAdmin
      .from('gig_applications')
      .select('*')
      .eq('gig_id', id)
      .eq('applicant_id', user.uid)
      .maybeSingle();

    if (!existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (existingApp.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot withdraw from a completed gig' }, { status: 400 });
    }

    const wasAccepted = existingApp.status === 'ACCEPTED';

    // Delete application
    await supabaseAdmin
      .from('gig_applications')
      .delete()
      .eq('gig_id', id)
      .eq('applicant_id', user.uid);

    // If applicant was already accepted, reopen the gig
    if (wasAccepted) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('gigs')
        .update({ status: 'open', accepted_applicant_id: null, updated_at: now })
        .eq('id', id);

      // Notify host
      const { data: gig } = await supabaseAdmin.from('gigs').select('host_id, author_id, title').eq('id', id).maybeSingle();
      const hostId = gig?.host_id || gig?.author_id;
      if (hostId) {
        await supabaseAdmin.from('notifications').insert({
          user_id: hostId,
          sender_id: user.uid,
          title: 'Freelancer Withdrew',
          message: `${user.full_name || 'Freelancer'} withdrew from "${gig?.title || 'your gig'}". The gig has been reopened.`,
          type: 'alert',
          read: false,
          created_at: now,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true, message: 'Application withdrawn successfully.' });
  } catch (err) {
    console.error('[DELETE /api/gigs/[id]/apply]', err.message);
    return NextResponse.json({ error: 'Failed to withdraw application' }, { status: 500 });
  }
}
