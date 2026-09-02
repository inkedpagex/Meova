import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { creditSparks } from '@/lib/wallet';

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: gig, error: fetchErr } = await supabaseAdmin
      .from('gigs')
      .select('id, host_id, author_id, title, reward_sparks, budget, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    const authorId = gig.author_id || gig.host_id;
    if (authorId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden. You are not the author.' }, { status: 403 });
    }

    if (gig.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel a gig that is already completed.' }, { status: 400 });
    }

    const budgetNum = parseInt(gig.budget || gig.reward_sparks, 10) || 0;
    const acceptedApplicantId = gig.accepted_applicant_id;

    // Delete gig
    const { error: deleteErr } = await supabaseAdmin.from('gigs').delete().eq('id', id);
    if (deleteErr) {
      return NextResponse.json({ error: 'Failed to cancel gig from database' }, { status: 500 });
    }

    // Clean up applications
    await supabaseAdmin.from('gig_applications').delete().eq('gig_id', id);

    // Refund escrowed sparks atomically to host
    if (budgetNum > 0) {
      await creditSparks(
        user.uid,
        budgetNum,
        'purchased',
        'refund',
        `Refund for cancelled gig: "${gig.title}"`,
        id
      );
    }

    // Notify accepted freelancer if any
    if (acceptedApplicantId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: acceptedApplicantId,
        sender_id: user.uid,
        title: 'Gig Cancelled',
        message: `The client cancelled the gig "${gig.title}". The task has been closed.`,
        type: 'alert',
        read: false,
        created_at: new Date().toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, message: 'Gig cancelled and Sparks refunded to your wallet.' });
  } catch (err) {
    console.error('[DELETE /api/gigs/[id]]', err.message);
    return NextResponse.json({ error: 'Failed to cancel gig' }, { status: 500 });
  }
}
