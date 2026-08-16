/**
 * sendPushNotification.js
 * Server-only: Send FCM push notifications to a user's registered devices.
 * Uses Firebase Admin Messaging — never runs on the client.
 */
import { adminDb } from './firebaseAdmin';

let adminMessaging = null;

async function getMessagingAdmin() {
  if (adminMessaging) return adminMessaging;
  try {
    const { getApps } = await import('firebase-admin/app');
    const apps = getApps();
    const adminApp = apps.find(a => a.name === 'admin');
    if (!adminApp) return null;
    const { getMessaging } = await import('firebase-admin/messaging');
    adminMessaging = getMessaging(adminApp);
    return adminMessaging;
  } catch (err) {
    console.warn('[sendPush] Firebase Messaging admin init failed:', err.message);
    return null;
  }
}

/**
 * Send a push notification to all devices registered for a given userId.
 * @param {string} userId - Firestore user ID
 * @param {{ title: string, body: string, url?: string }} payload
 */
export async function sendPush(userId, { title, body, url = '/' }) {
  if (!adminDb || !userId) return;

  try {
    const messaging = await getMessagingAdmin();
    if (!messaging) return;

    // Fetch all stored FCM tokens for this user
    const tokensSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
    if (tokens.length === 0) return;

    const message = {
      tokens,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-512.png',
          badge: '/icon-512.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
        },
        fcmOptions: { link: url },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    // Clean up invalid / expired tokens
    const invalidTokenDocs = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokenDocs.push(tokensSnap.docs[idx]);
        }
      }
    });

    if (invalidTokenDocs.length > 0) {
      const batch = adminDb.batch();
      invalidTokenDocs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (err) {
    console.error('[sendPush] Error:', err.message);
  }
}
