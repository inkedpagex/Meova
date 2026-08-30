/**
 * GET /api/users/[id]/applications
 * Returns all gigs the given user has applied to, enriched with gig title.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Users can only see their own applications
    if (id !== user.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Query gig_applications for this user, join with gigs for title
    const { data, error } = await supabaseAdmin
      .from('gig_applications')
      .select(`
        id,
        gig_id,
        applicant_id,
        pitch,
        status,
        created_at,
        accepted_at,
        rejected_at,
        meeting_code,
        escrow_amount,
        gigs (
          id,
          title,
          budget,
          status
        )
      `)
      .eq('applicant_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/users/[id]/applications]', error.message);
      return NextResponse.json({ applications: [] });
    }

    const applications = (data || []).map(app => ({
      id: app.id,
      gigId: app.gig_id,
      gigTitle: app.gigs?.title || 'Gig',
      gigBudget: app.gigs?.budget || '0',
      pitch: app.pitch,
      status: app.status,
      appliedAt: app.created_at,
      acceptedAt: app.accepted_at,
      rejectedAt: app.rejected_at,
      meetingCode: app.meeting_code,
      escrowAmount: app.escrow_amount,
    }));

    return NextResponse.json({ applications });
  } catch (err) {
    console.error('[GET /api/users/[id]/applications]', err.message);
    return NextResponse.json({ applications: [] });
  }
}
