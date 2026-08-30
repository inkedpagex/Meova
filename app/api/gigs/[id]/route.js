import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';

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

    if (gig.status === 'completed' || gig.status === 'in_progress') {
      return NextResponse.json({ error: 'Cannot delete a gig that is in progress or completed.' }, { status: 400 });
    }

    const budgetNum = parseInt(gig.budget || gig.reward_sparks, 10) || 0;

    // Delete gig and refund sparks in parallel
    const ops = [
      supabaseAdmin.from('gigs').delete().eq('id', id),
    ];

    if (budgetNum > 0) {
      ops.push(
        // Refund sparks to purchased bucket
        supabaseAdmin
          .from('wallets')
          .select('purchased')
          .eq('user_id', user.uid)
          .maybeSingle()
          .then(async ({ data: wallet }) => {
            if (wallet) {
              await supabaseAdmin
                .from('wallets')
                .update({ purchased: (wallet.purchased || 0) + budgetNum, updated_at: new Date().toISOString() })
                .eq('user_id', user.uid);
            }
          }),
        supabaseAdmin.from('transactions').insert({
          user_id: user.uid,
          type: 'refund',
          amount: budgetNum,
          description: `Refund for deleted gig: "${gig.title}"`,
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
        })
      );
    }

    await Promise.all(ops);

    return NextResponse.json({ ok: true, message: 'Gig deleted and sparks refunded.' });
  } catch (err) {
    console.error('[DELETE /api/gigs/[id]]', err.message);
    return NextResponse.json({ error: 'Failed to delete gig' }, { status: 500 });
  }
}
