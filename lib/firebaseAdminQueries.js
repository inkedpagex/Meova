/**
 * firebaseAdminQueries.js
 * Server-side Firestore queries for Server Components and API routes.
 * All functions return plain JS objects (no Timestamp classes).
 */
import { adminDb } from './firebaseAdmin';

// ─── Helper: serialize Firestore doc ─────────────────────────────────────────

function serializeDoc(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  // Convert any Firestore Timestamps to ISO strings
  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v.toDate === 'function') {
      clean[k] = v.toDate().toISOString();
    } else {
      clean[k] = v;
    }
  }
  return { id: doc.id, ...clean };
}

function serializeDocs(snapshot) {
  if (!snapshot || snapshot.empty) return [];
  return snapshot.docs.map(serializeDoc).filter(Boolean);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsersAdmin(limitCount = 50) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('users').limit(limitCount).get();
    return serializeDocs(snap);
  } catch (err) {
    console.error('[fetchUsersAdmin]', err.message);
    return [];
  }
}

export async function fetchProfileAdmin(userId) {
  if (!adminDb || !userId) return null;
  try {
    const doc = await adminDb.collection('users').doc(userId).get();
    return serializeDoc(doc);
  } catch (err) {
    console.error('[fetchProfileAdmin]', err.message);
    return null;
  }
}

// ─── Circles ─────────────────────────────────────────────────────────────────

export async function fetchCirclesAdmin(limitCount = 20) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('circles').limit(limitCount).get();
    return serializeDocs(snap);
  } catch (err) {
    console.error('[fetchCirclesAdmin]', err.message);
    return [];
  }
}

export async function fetchCircleDetailAdmin(circleId) {
  if (!adminDb || !circleId) return null;
  try {
    const doc = await adminDb.collection('circles').doc(circleId).get();
    return serializeDoc(doc);
  } catch (err) {
    console.error('[fetchCircleDetailAdmin]', err.message);
    return null;
  }
}

export async function fetchCircleMembersAdmin(circleId) {
  if (!adminDb || !circleId) return [];
  try {
    const snap = await adminDb
      .collection('circle_members')
      .where('circle_id', '==', circleId)
      .get();
    return serializeDocs(snap);
  } catch (err) {
    console.error('[fetchCircleMembersAdmin]', err.message);
    return [];
  }
}

export async function fetchCircleEventsAdmin(circleId) {
  if (!adminDb || !circleId) return [];
  try {
    const snap = await adminDb
      .collection('events')
      .where('circle_id', '==', circleId)
      .get();
    return serializeDocs(snap);
  } catch (err) {
    console.error('[fetchCircleEventsAdmin]', err.message);
    return [];
  }
}

export async function fetchJoinedCirclesAdmin(userId) {
  if (!adminDb || !userId) return [];
  try {
    const snap = await adminDb
      .collection('circle_members')
      .where('user_id', '==', userId)
      .get();
    if (snap.empty) return [];
    const circleIds = snap.docs.map(d => d.data().circle_id).filter(Boolean);
    if (!circleIds.length) return [];
    // Batch fetch circles (Firestore 'in' supports up to 30)
    const circles = [];
    for (let i = 0; i < circleIds.length; i += 30) {
      const batch = circleIds.slice(i, i + 30);
      const batchSnap = await adminDb
        .collection('circles')
        .where('__name__', 'in', batch)
        .get();
      circles.push(...serializeDocs(batchSnap));
    }
    return circles;
  } catch (err) {
    console.error('[fetchJoinedCirclesAdmin]', err.message);
    return [];
  }
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function fetchUpcomingEventsAdmin(limitCount = 12) {
  if (!adminDb) return [];
  try {
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const snap = await adminDb
      .collection('events')
      .where('date', '>=', now)
      .orderBy('date', 'asc')
      .limit(limitCount)
      .get();
    return serializeDocs(snap);
  } catch (err) {
    console.error('[fetchUpcomingEventsAdmin]', err.message);
    return [];
  }
}

// ─── Experiences ─────────────────────────────────────────────────────────────

export async function fetchExperiencesAdmin(limitCount = 20) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb
      .collection('experiences')
      .where('active', '!=', false)
      .limit(limitCount)
      .get();
    return serializeDocs(snap);
  } catch (err) {
    // Fallback without filter if index not set up
    try {
      const snap2 = await adminDb.collection('experiences').limit(limitCount).get();
      return serializeDocs(snap2);
    } catch (err2) {
      console.error('[fetchExperiencesAdmin]', err2.message);
      return [];
    }
  }
}

export async function fetchUserExperiencesAdmin(hostId) {
  if (!adminDb || !hostId) return [];
  try {
    const snap = await adminDb
      .collection('experiences')
      .where('hostId', '==', hostId)
      .get();
    return serializeDocs(snap);
  } catch (err) {
    console.error('[fetchUserExperiencesAdmin]', err.message);
    return [];
  }
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchUserBookingsAdmin(userId) {
  if (!adminDb || !userId) return [];
  try {
    const [asGuest, asHost] = await Promise.all([
      adminDb.collection('bookings').where('guestId', '==', userId).get(),
      adminDb.collection('bookings').where('hostId', '==', userId).get(),
    ]);
    const all = [...serializeDocs(asGuest), ...serializeDocs(asHost)];
    // Deduplicate by id
    const seen = new Set();
    return all.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true; });
  } catch (err) {
    console.error('[fetchUserBookingsAdmin]', err.message);
    return [];
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotificationsAdmin(userId, limitCount = 30) {
  if (!adminDb || !userId) return [];
  try {
    const snap = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(limitCount)
      .get();
    return serializeDocs(snap);
  } catch (err) {
    console.error('[fetchNotificationsAdmin]', err.message);
    return [];
  }
}
