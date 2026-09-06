import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    // Rate Limit: Max 5 inquiries per 15 minutes per IP
    const rl = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many inquiries submitted. Please wait 15 minutes before sending another message.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, college, category, message } = body;

    // Field sanitization & limits
    const cleanName = (name || '').trim().slice(0, 70);
    const cleanEmail = (email || '').trim().toLowerCase().slice(0, 100);
    const cleanCollege = (college || '').trim().slice(0, 100);
    const cleanCategory = (category || 'General Support').trim().slice(0, 50);
    const cleanMessage = (message || '').trim().slice(0, 1000);

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name (at least 2 characters).' }, { status: 400 });
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!cleanMessage || cleanMessage.length < 10) {
      return NextResponse.json({ error: 'Please provide at least 10 characters describing your inquiry.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let inquiryId = null;

    // 1. Attempt primary insert into contact_inquiries table
    try {
      const { data: inqData, error: inqErr } = await supabaseAdmin
        .from('contact_inquiries')
        .insert({
          name: cleanName,
          email: cleanEmail,
          college: cleanCollege || null,
          category: cleanCategory,
          message: cleanMessage,
          ip_address: ip,
          status: 'pending',
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (!inqErr && inqData?.id) {
        inquiryId = inqData.id;
      }
    } catch (tblErr) {
      console.warn('[POST /api/contact] contact_inquiries table bypass:', tblErr?.message);
    }

    // 2. Always persist into audit_logs (guarantees zero inquiry drops)
    const { error: logErr } = await supabaseAdmin.from('audit_logs').insert({
      action: 'CONTACT_INQUIRY',
      message: `[${cleanCategory}] ${cleanName} (${cleanEmail}): ${cleanMessage.slice(0, 120)}`,
      details: {
        inquiry_id: inquiryId,
        name: cleanName,
        email: cleanEmail,
        college: cleanCollege || null,
        category: cleanCategory,
        full_message: cleanMessage,
        ip_address: ip,
        created_at: now,
      },
    });

    if (logErr && !inquiryId) {
      console.error('[POST /api/contact log error]', logErr.message);
      return NextResponse.json(
        { error: 'Failed to record your inquiry. Please email us directly at support@meova.in.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your inquiry has been received. Our campus support desk will reply to your email within 24 hours.',
      inquiryId,
    });
  } catch (err) {
    console.error('[POST /api/contact fatal error]', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again later or email support@meova.in.' },
      { status: 500 }
    );
  }
}
