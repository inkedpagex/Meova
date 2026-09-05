import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

/**
 * GET /api/notifications/push-debug
 * Returns diagnostic info about native FCM configuration and registered device tokens.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT || null;
    let serviceAccountOk = false;
    let projectId = null;
    let clientEmail = null;

    if (rawKey) {
      try {
        const parsed = typeof rawKey === 'string' ? JSON.parse(rawKey) : rawKey;
        serviceAccountOk = !!(parsed.project_id && parsed.client_email && parsed.private_key);
        projectId = parsed.project_id || null;
        clientEmail = parsed.client_email || null;
      } catch {
        serviceAccountOk = false;
      }
    }

    // Check device tokens in minimal device_tokens table
    const { data: tokenRows, error: tokenErr } = await supabaseAdmin
      .from('device_tokens')
      .select('id, platform, fcm_token, updated_at')
      .eq('user_id', user.uid);

    const tokens = tokenRows || [];

    const tokenDetails = tokens.map((row, i) => ({
      index: i + 1,
      id: row.id,
      platform: row.platform,
      token_preview: row.fcm_token ? row.fcm_token.slice(0, 20) + '...' + row.fcm_token.slice(-10) : 'EMPTY',
      token_length: row.fcm_token?.length || 0,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({
      userId: user.uid,
      mode: 'Native FCM (Capacitor / Android)',
      firebaseConfigured: serviceAccountOk,
      firebaseProjectId: projectId,
      firebaseClientEmail: clientEmail,
      deviceTokenCount: tokens.length,
      deviceTokenQueryError: tokenErr ? tokenErr.message : null,
      deviceTokens: tokenDetails,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
