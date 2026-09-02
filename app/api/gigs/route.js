import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { spendSparks, creditSparks } from '@/lib/wallet';
import { isFeatureEnabled } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isEnabled = await isFeatureEnabled('gigs');
    if (!isEnabled) {
      return NextResponse.json({ gigs: [], featureDisabled: true });
    }

    const { data: gigs, error } = await supabaseAdmin
      .from('gigs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/gigs]', error.message);
      return NextResponse.json({ gigs: [] });
    }

    const formatted = (gigs || []).map((g) => ({
      ...g,
      budget: g.reward_sparks,
      reward: g.reward_sparks,
      desc: g.description,
      author_id: g.host_id,
      author_name: g.host_name,
      author_photo: g.host_photo,
      company: g.host_name || 'Campus Host',
    }));

    return NextResponse.json(
      { gigs: formatted },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[GET /api/gigs]', err.message);
    return NextResponse.json({ gigs: [] });
  }
}

export async function POST(request) {
  try {
    const isEnabled = await isFeatureEnabled('gigs');
    if (!isEnabled) {
      return NextResponse.json({ error: 'Campus Gigs feature is currently disabled by Admin.' }, { status: 403 });
    }

    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, category, budget, reward, desc, description } = body;

    const finalTitle = (title || '').trim();
    const finalDesc = (desc || description || '').trim();

    if (!finalTitle || !finalDesc) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const budgetNum = Math.max(0, parseInt(budget || reward, 10) || 0);
    if (budgetNum < 0 || budgetNum > 2000) {
      return NextResponse.json({ error: 'Reward must be between 0 and 2000 Sparks' }, { status: 400 });
    }

    // Deduct Sparks immediately for escrow via spendSparks
    let sparksDeducted = false;
    if (budgetNum > 0) {
      const spendResult = await spendSparks(
        user.uid,
        budgetNum,
        `Escrow for Gig: "${finalTitle}"`,
        'gig_escrow',
        null
      );

      if (!spendResult.ok) {
        return NextResponse.json({ error: spendResult.error || 'Insufficient Sparks to fund this gig' }, { status: 402 });
      }
      sparksDeducted = true;
    }

    // Match exact Supabase public.gigs columns:
    // ['id', 'title', 'description', 'category', 'reward_sparks', 'status', 'host_id', 'host_name', 'host_photo', 'selected_applicant_id', 'applications_count', 'created_at', 'expires_at']
    const newGigPayload = {
      title: finalTitle,
      description: finalDesc,
      category: category || 'General',
      reward_sparks: budgetNum,
      status: 'open',
      host_id: user.uid,
      host_name: user.full_name || 'Campus Student',
      host_photo: user.photo_url || '',
      applications_count: 0,
      created_at: new Date().toISOString(),
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
          `Auto-refund for failed gig creation: "${finalTitle}"`
        ).catch((err) => console.error('[POST /api/gigs rollback failed]', err.message));
      }
      return NextResponse.json({ error: `Failed to create gig: ${insertErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      gig: {
        ...insertedGig,
        budget: budgetNum,
        desc: finalDesc,
        author_id: user.uid,
        author_name: user.full_name,
      },
    });
  } catch (err) {
    console.error('[POST /api/gigs]', err.message);
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 });
  }
}
