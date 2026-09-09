import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { sendPush } from '@/lib/sendPushNotification';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const ip = getClientIp(req);
  const rl = rateLimit(`notif-test:${ip}`, { limit: 15, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Please wait a moment before sending another test alert' }, { status: 429 });
  }

  try {
    const authUser = await requireAuth();
    if (!authUser?.uid) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to test notifications.' }, { status: 401 });
    }

    const bodyData = await req.json().catch(() => ({}));
    const testType = bodyData?.type || 'system';

    // Dispatch notification pipeline (with timeout protection so API never hangs)
    await Promise.race([
      sendPush(authUser.uid, {
        title: 'Meova Test Notification',
        body: 'Your push & realtime notifications are working perfectly!',
        url: '/notifications',
        type: testType,
        senderName: 'Meova Campus',
        senderPhoto: '/icon.png',
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Push dispatch timed out')), 4500)),
    ]).catch((err) => {
      console.warn('[POST /api/notifications/test] Warning during sendPush:', err.message);
    });

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully!',
    });
  } catch (err) {
    console.error('[POST /api/notifications/test]', err.message);
    return NextResponse.json({ error: err.message || 'Failed to dispatch test notification' }, { status: 500 });
  }
}
