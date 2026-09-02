/**
 * GET  /api/gigs/[id]/applications  — host fetches all applicants for their gig
 * PATCH /api/gigs/[id]/applications — host accepts or rejects an applicant
 *
 * On ACCEPT:
 *   - Generate 6-digit meetingCode stored on application doc
 *   - Auto-open DM thread between host + freelancer (via chats table)
 *   - Notify freelancer (in-app notification)
 *
 * On REJECT:
 *   - Update status to REJECTED
 *   - Notify freelancer (in-app)
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { sendPush } from '@/lib/sendPushNotification';

// ── GET — list all applicants ───────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Fetch gig to verify ownership
    const { data: gig, error: gigErr } = await supabaseAdmin
      .from('gigs')
      .select('id, host_id, author_id')
      .eq('id', id)
      .maybeSingle();

    if (gigErr || !gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    const authorId = gig.author_id || gig.host_id;
    if (authorId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: applications, error: appsErr } = await supabaseAdmin
      .from('gig_applications')
      .select('*')
      .eq('gig_id', id)
      .order('created_at', { ascending: false });

    if (appsErr) throw new Error(appsErr.message);

    return NextResponse.json({ applications: applications || [] });
  } catch (err) {
    console.error('[GET /api/gigs/[id]/applications]', err.message);
    return NextResponse.json({ applications: [] });
  }
}

// ── PATCH — accept or reject an applicant ──────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { applicantId, action } = await request.json();

    if (!applicantId || !['accept', 'reject', 'cancel_accepted', 'unassign'].includes(action)) {
      return NextResponse.json({ error: 'Missing applicantId or invalid action' }, { status: 400 });
    }

    // Fetch gig
    const { data: gig, error: gigErr } = await supabaseAdmin
      .from('gigs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (gigErr || !gig) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });

    const authorId = gig.author_id || gig.host_id;
    if (authorId !== user.uid) {
      return NextResponse.json({ error: 'Only the gig author can manage applications' }, { status: 403 });
    }

    // Fetch application
    const { data: app, error: appErr } = await supabaseAdmin
      .from('gig_applications')
      .select('*')
      .eq('gig_id', id)
      .eq('applicant_id', applicantId)
      .maybeSingle();

    if (appErr || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    const now = new Date().toISOString();

    // ── CANCEL ACCEPTED APPLICANT (REOPEN GIG) ──────────────────────────────
    if (action === 'cancel_accepted' || action === 'unassign') {
      await Promise.all([
        supabaseAdmin
          .from('gig_applications')
          .update({ status: 'CANCELLED', updated_at: now })
          .eq('gig_id', id)
          .eq('applicant_id', applicantId),

        supabaseAdmin
          .from('gigs')
          .update({ status: 'open', accepted_applicant_id: null, updated_at: now })
          .eq('id', id),

        supabaseAdmin.from('notifications').insert({
          user_id: applicantId,
          sender_id: user.uid,
          title: 'Gig Assignment Cancelled',
          message: `The host cancelled your assignment for "${gig.title}". The gig has been reopened.`,
          type: 'alert',
          read: false,
          created_at: now,
        }),
      ]);

      return NextResponse.json({ ok: true, message: 'Applicant unassigned. Gig reopened.' });
    }

    if (app.status !== 'pending') {
      return NextResponse.json({ error: 'Application already processed' }, { status: 400 });
    }

    // ── ACCEPT ──────────────────────────────────────────────────────────────
    if (action === 'accept') {
      const meetingCode = String(Math.floor(100000 + Math.random() * 900000));

      // Fetch other pending applicants to notify them
      const { data: otherApps } = await supabaseAdmin
        .from('gig_applications')
        .select('applicant_id')
        .eq('gig_id', id)
        .eq('status', 'pending')
        .neq('applicant_id', applicantId);

      const rejectPromises = (otherApps || []).map(a => [
        supabaseAdmin.from('gig_applications').update({ status: 'REJECTED', rejected_at: now }).eq('gig_id', id).eq('applicant_id', a.applicant_id),
        supabaseAdmin.from('notifications').insert({
          user_id: a.applicant_id,
          sender_id: user.uid,
          title: 'Gig Filled',
          message: `The gig "${gig.title}" has been assigned to another student.`,
          type: 'gig_rejected',
          read: false,
          created_at: now,
        })
      ]).flat();

      // Auto-open DM thread between host and freelancer
      const sortedIds = [user.uid, applicantId].sort();
      const chatId = `${sortedIds[0]}_${sortedIds[1]}`;

      await Promise.all([
        ...rejectPromises,
        // Update application status
        supabaseAdmin
          .from('gig_applications')
          .update({ status: 'ACCEPTED', meeting_code: meetingCode, accepted_at: now })
          .eq('gig_id', id)
          .eq('applicant_id', applicantId),

        // Mark gig as in-progress
        supabaseAdmin
          .from('gigs')
          .update({ status: 'in_progress', accepted_applicant_id: applicantId, updated_at: now })
          .eq('id', id),

        // Upsert chat thread
        supabaseAdmin
          .from('chats')
          .upsert({
            id: chatId,
            participants: [user.uid, applicantId],
            last_message: `You've been accepted for the gig "${gig.title}"! Connect here to coordinate.`,
            last_sender_id: 'system',
            last_message_at: now,
            created_at: now,
          }, { onConflict: 'id' }),

        // System message in chat
        supabaseAdmin.from('chat_messages').insert({
          chat_id: chatId,
          sender_id: 'system',
          text: `You've been accepted for the gig "${gig.title}"! Connect here to coordinate.`,
          status: 'delivered',
          created_at: now,
        }),

        // Notify freelancer
        supabaseAdmin.from('notifications').insert({
          user_id: applicantId,
          sender_id: user.uid,
          title: 'Gig Accepted!',
          message: `${user.full_name || 'Host'} accepted you for "${gig.title}". Check messages to get started.`,
          type: 'gig_accepted',
          read: false,
          created_at: now,
        }),
      ]);

      // FCM push (non-blocking)
      sendPush(applicantId, {
        title: 'Gig Accepted!',
        body: `You got the gig: "${gig.title}"`,
        url: '/gigs',
      }).catch(() => {});

      return NextResponse.json({ ok: true, action: 'accepted', meetingCode });
    }

    // ── REJECT ──────────────────────────────────────────────────────────────
    if (action === 'reject') {
      await Promise.all([
        supabaseAdmin
          .from('gig_applications')
          .update({ status: 'REJECTED', rejected_at: now })
          .eq('gig_id', id)
          .eq('applicant_id', applicantId),

        supabaseAdmin.from('notifications').insert({
          user_id: applicantId,
          sender_id: user.uid,
          title: 'Application Update',
          message: `Your application for "${gig.title}" was not selected this time.`,
          type: 'gig_rejected',
          read: false,
          created_at: now,
        }),
      ]);

      sendPush(applicantId, {
        title: 'Application Update',
        body: `Your application for "${gig.title}" was not selected.`,
        url: '/gigs',
      }).catch(() => {});

      return NextResponse.json({ ok: true, action: 'rejected' });
    }
  } catch (err) {
    console.error('[PATCH /api/gigs/[id]/applications]', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
