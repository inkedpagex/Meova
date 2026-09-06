import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/ambassador/apply
 * Submit an ambassador application.
 */
export async function POST(request) {
  try {
    let user = null;
    try {
      user = await requireAuth();
    } catch {
      user = null;
    }

    const body = await request.json();
    const {
      college_id,
      college_name,
      full_name,
      email,
      phone,
      year,
      branch,
      why_ambassador,
      instagram_handle,
      linkedin_url,
      meeting_locations,
    } = body;

    // Validation with Anti-Spam Character Limits
    if (!full_name?.trim() || full_name.trim().length < 2) {
      return NextResponse.json({ error: 'Full name must be at least 2 characters' }, { status: 400 });
    }
    if (full_name.trim().length > 50) {
      return NextResponse.json({ error: 'Full name must not exceed 50 characters' }, { status: 400 });
    }

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 60) {
      return NextResponse.json({ error: 'A valid email address (max 60 characters) is required' }, { status: 400 });
    }

    if (college_name && college_name.trim().length > 80) {
      return NextResponse.json({ error: 'University name must not exceed 80 characters' }, { status: 400 });
    }

    const cleanPhone = (phone || '').replace(/[\s\-\+]/g, '');
    if (!phone?.trim() || cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json({ error: 'A valid 10-15 digit phone number is required' }, { status: 400 });
    }

    if (year && year.trim().length > 20) {
      return NextResponse.json({ error: 'Study year must not exceed 20 characters' }, { status: 400 });
    }

    if (branch && branch.trim().length > 40) {
      return NextResponse.json({ error: 'Course / Branch must not exceed 40 characters' }, { status: 400 });
    }

    if (instagram_handle && instagram_handle.trim().length > 30) {
      return NextResponse.json({ error: 'Instagram handle must not exceed 30 characters' }, { status: 400 });
    }

    if (linkedin_url && linkedin_url.trim().length > 80) {
      return NextResponse.json({ error: 'LinkedIn URL must not exceed 80 characters' }, { status: 400 });
    }

    if (!why_ambassador?.trim() || why_ambassador.trim().length < 20) {
      return NextResponse.json({ error: 'Please write at least 20 characters explaining why you want to be an ambassador' }, { status: 400 });
    }
    if (why_ambassador.trim().length > 150) {
      return NextResponse.json({ error: 'Why ambassador note must not exceed 150 characters' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if already an ambassador or has a pending application
    let existingQuery = supabaseAdmin
      .from('ambassador_applications')
      .select('id, status')
      .in('status', ['pending', 'shortlisted', 'approved']);

    if (user?.uid) {
      existingQuery = existingQuery.or(`user_id.eq.${user.uid},email.eq.${cleanEmail}`);
    } else {
      existingQuery = existingQuery.eq('email', cleanEmail);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: `An ambassador application for this email already exists with status: ${existing.status}`,
        existingId: existing.id,
      }, { status: 409 });
    }

    if (user?.uid) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_ambassador')
        .eq('id', user.uid)
        .maybeSingle();

      if (profile?.is_ambassador) {
        return NextResponse.json({ error: 'You are already a Campus Ambassador.' }, { status: 409 });
      }
    }

    // Insert application
    const { data: app, error: insertErr } = await supabaseAdmin
      .from('ambassador_applications')
      .insert({
        user_id: user?.uid || null,
        college_id: college_id || null,
        college_name: college_name?.trim() || null,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        year: year?.trim() || null,
        branch: branch?.trim() || null,
        why_ambassador: why_ambassador.trim(),
        instagram_handle: instagram_handle?.trim() || null,
        linkedin_url: linkedin_url?.trim() || null,
        meeting_locations: Array.isArray(meeting_locations) ? meeting_locations.filter(Boolean) : [],
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id, status')
      .single();

    if (insertErr) {
      console.error('[POST /api/ambassador/apply]', insertErr.message);
      return NextResponse.json({ error: 'Failed to submit application. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, applicationId: app.id, status: app.status });
  } catch (err) {
    console.error('[POST /api/ambassador/apply]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/ambassador/apply
 * Get current application status for the logged-in user.
 */
export async function GET() {
  try {
    let user = null;
    try {
      user = await requireAuth();
    } catch {
      user = null;
    }
    if (!user) return NextResponse.json({ status: 'none', application: null });

    // Check if user is already an admin or ambassador in profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, is_ambassador, ambassador_tier')
      .eq('id', user.uid)
      .maybeSingle();

    if (user.role === 'admin' || profile?.role === 'admin' || profile?.is_ambassador) {
      return NextResponse.json({
        status: 'approved',
        isAdmin: user.role === 'admin' || profile?.role === 'admin',
        isAmbassador: true,
        ambassadorTier: profile?.ambassador_tier || 'full',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('ambassador_applications')
      .select('id, status, created_at, admin_note, shortlisted_at, approved_at')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ status: 'none', application: null });
    }

    return NextResponse.json({ status: data?.status || 'none', application: data || null });
  } catch (err) {
    console.error('[GET /api/ambassador/apply]', err.message);
    return NextResponse.json({ status: 'none', application: null });
  }
}
