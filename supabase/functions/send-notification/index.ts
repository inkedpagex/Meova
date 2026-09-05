// Supabase Edge Function: send-notification (Deno Runtime)
// Dispatches native Firebase Cloud Messaging (FCM) HTTP v1 push notifications to Android devices.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendNotificationPayload {
  target_user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Helper: Generates Google OAuth2 Access Token using Firebase Service Account RS256 JWT
async function getGoogleOAuth2Token(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const toBase64Url = (str: string) =>
    btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedClaim = toBase64Url(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Strip PEM headers and whitespace
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = toBase64Url(
    String.fromCharCode(...new Uint8Array(signature))
  );

  const jwt = `${signatureInput}.${encodedSignature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      `Failed to obtain Google access token: ${tokenData.error_description || tokenData.error || tokenRes.status}`
    );
  }

  return tokenData.access_token;
}

Deno.serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const serviceAccountKeyRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY') || '';

    if (!serviceAccountKeyRaw) {
      return new Response(
        JSON.stringify({
          error: 'FIREBASE_SERVICE_ACCOUNT_KEY secret is not configured in Supabase secrets.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serviceAccountKeyRaw);
    } catch {
      return new Response(
        JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const projectId = serviceAccount.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Service account missing project_id.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SendNotificationPayload = await req.json().catch(() => ({}));
    const { target_user_id, title, body: messageBody, data = {} } = body;

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'target_user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Look up user's active FCM device tokens from minimal device_tokens table
    const { data: tokenRows, error: tokenError } = await supabase
      .from('device_tokens')
      .select('id, fcm_token, platform')
      .eq('user_id', target_user_id);

    if (tokenError) {
      return new Response(
        JSON.stringify({ error: tokenError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenRows || tokenRows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'User has no registered device tokens. Skipped.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Obtain short-lived Google OAuth2 token
    const accessToken = await getGoogleOAuth2Token(serviceAccount);

    // 3. Stringify all custom data fields (FCM HTTP v1 requires Map<String, String>)
    const stringData: Record<string, string> = {};
    for (const [k, v] of Object.entries(data || {})) {
      stringData[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    if (!stringData.url) stringData.url = '/';

    const results = [];
    const staleTokenIds: string[] = [];

    const isCall = stringData.isCall === 'true' || stringData.type === 'incoming_call';

    // 4. Send to each registered device
    for (const tokenRow of tokenRows) {
      const fcmMessage = {
        message: {
          token: tokenRow.fcm_token,
          notification: {
            title: title || 'Meova',
            body: messageBody || '',
          },
          data: stringData,
          android: {
            priority: 'HIGH',
            notification: {
              sound: 'default',
              click_action: 'FCM_PLUGIN_ACTIVITY',
              channel_id: isCall ? 'meova_calls' : 'meova_alerts',
              visibility: 'PUBLIC',
              notification_priority: isCall ? 'PRIORITY_MAX' : 'PRIORITY_HIGH',
              default_vibrate_timings: true,
              default_sound: true,
            },
          },
        },
      };

      try {
        const fcmRes = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(fcmMessage),
          }
        );

        const fcmData = await fcmRes.json();

        if (!fcmRes.ok) {
          const errorCode = fcmData?.error?.details?.[0]?.errorCode || fcmData?.error?.status;
          // Clean up dead/unregistered tokens
          if (
            fcmRes.status === 404 ||
            errorCode === 'UNREGISTERED' ||
            errorCode === 'INVALID_ARGUMENT' ||
            fcmData?.error?.message?.includes('Requested entity was not found')
          ) {
            staleTokenIds.push(tokenRow.id);
          }
          results.push({ token_id: tokenRow.id, status: 'failed', error: fcmData.error });
        } else {
          results.push({ token_id: tokenRow.id, status: 'sent', name: fcmData.name });
        }
      } catch (sendErr: any) {
        results.push({ token_id: tokenRow.id, status: 'error', error: sendErr.message });
      }
    }

    // 5. Purge stale/unregistered tokens automatically
    if (staleTokenIds.length > 0) {
      await supabase.from('device_tokens').delete().in('id', staleTokenIds);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: results.filter((r) => r.status === 'sent').length,
        purgedTokens: staleTokenIds.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
