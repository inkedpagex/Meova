import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { rateLimit, getClientIp } from '../../../lib/rateLimit';
import { requireAuth } from '../../../lib/getAdminUser';

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[GET /api/notifications]', error.message);
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const formatted = (notifications || []).map(n => ({
      id: n.id,
      title: n.title,
      body: n.message || n.body,
      type: n.type,
      read: n.read,
      created_at: n.created_at,
    }));

    const unreadCount = formatted.filter(n => !n.read).length;
    return NextResponse.json({ notifications: formatted, unreadCount });
  } catch (err) {
    console.error('[GET /api/notifications]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.uid)
      .eq('read', false);

    if (error) {
      console.error('[PATCH /api/notifications]', error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/notifications]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req) {
  const ip = getClientIp(req);
  const rl = rateLimit(`notif:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { userId, title, body, type } = await req.json();
    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes = ['booking', 'sparks', 'message', 'alert'];
    const notifType = validTypes.includes(type) ? type : 'system';

    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title,
      message: body,
      type: notifType,
      read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[POST /api/notifications insert error]', error.message);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/notifications]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
