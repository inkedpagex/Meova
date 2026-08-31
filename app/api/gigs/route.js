import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { spendSparks, creditSparks } from '@/lib/wallet';

export async function GET() {
  try {
    const { data: gigs, error } = await supabaseAdmin
      .from('gigs')
      .select('*')
      .neq('is_hidden', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/gigs]', error.message);
      return NextResponse.json({ gigs: [] });
    }

    return NextResponse.json({ gigs: gigs || [] });
  } catch (err) {
    console.error('[GET /api/gigs]', err.message);
    return NextResponse.json({ gigs: [] });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, company, category, budget, duration, type, desc } = await request.json();

    if (!title || !desc) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const budgetNum = Math.max(0, parseInt(budget, 10) || 0);
    if (budgetNum < 0 || budgetNum > 2000) {
      return NextResponse.json({ error: 'Reward must be between 0 and 2000 Sparks' }, { status: 400 });
    }

    // Deduct Sparks immediately for escrow via spendSparks RPC
    let sparksDeducted = false;
    if (budgetNum > 0) {
      const spendResult = await spendSparks(
        user.uid,
        budgetNum,
        `Escrow for Gig: "${title}"`,
        'gig_escrow',
        null
      );

      if (!spendResult.ok) {
        return NextResponse.json({ error: spendResult.error || 'Insufficient Sparks to fund this gig' }, { status: 402 });
      }
      sparksDeducted = true;
    }

    const newGigPayload = {
      title,
      company: company || user.full_name || 'Campus Host',
      category: category || 'General',
      budget: String(budgetNum),
      duration: duration || 'Flexible',
      type: type || 'CAMPUS GIG',
      desc,
      author_id: user.uid,
      author_name: user.full_name || 'Host',
      created_at: new Date().toISOString(),
      applications_count: 0,
      is_hidden: false,
    };

    const { data: insertedGig, error: insertErr } = await supabaseAdmin
      .from('gigs')
      .insert(newGigPayload)
      .select()
      .single();

    if (insertErr) {
      console.error('[POST /api/gigs insert error]', insertErr.message);
      // Auto-Rollback: Refund escrow sparks if gig insert failed
      if (sparksDeducted && budgetNum > 0) {
        await creditSparks(
          user.uid,
          budgetNum,
          'purchased',
          'dispute_refund',
          `Auto-refund for failed gig creation: "${title}"`
        ).catch(err => console.error('[POST /api/gigs rollback failed]', err.message));
      }
      return NextResponse.json({ error: 'Failed to create gig. Sparks refunded if deducted.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, gig: insertedGig });
  } catch (err) {
    console.error('[POST /api/gigs]', err.message);
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 });
  }
}
