/**
 * POST /api/algolia/sync
 * Syncs a user or experience record into Algolia for instant search.
 * Protected: only called from server-side API routes (not exposed to clients directly).
 *
 * SETUP: Add these to .env.local:
 *   NEXT_PUBLIC_ALGOLIA_APP_ID=YOUR_APP_ID
 *   NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=YOUR_SEARCH_ONLY_KEY   (public, safe)
 *   ALGOLIA_ADMIN_KEY=YOUR_ADMIN_KEY                       (private, never expose)
 *
 * Get keys from: algolia.com → Your App → API Keys
 * Indices to create: Meova_users, Meova_experiences
 */
import { NextResponse } from 'next/server';

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;

async function upsertAlgoliaRecord(indexName, record) {
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    // Algolia not configured — silent skip (feature degrades gracefully)
    return;
  }

  const url = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/${encodeURIComponent(record.objectID)}`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': ALGOLIA_ADMIN_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Algolia PUT failed: ${err}`);
  }
}

export async function POST(request) {
  try {
    const { type, data } = await request.json();

    if (!type || !data || !data.id) {
      return NextResponse.json({ error: 'Missing type or data.id' }, { status: 400 });
    }

    if (type === 'user') {
      await upsertAlgoliaRecord('Meova_users', {
        objectID: data.id,
        full_name: data.full_name || '',
        year: data.year || '',
        branch: data.branch || '',
        college: data.college || '',
        interests: data.interests || [],
        photo_url: data.photo_url || '',
        isLiveOnCampus: data.isLiveOnCampus || false,
      });
    } else if (type === 'experience') {
      await upsertAlgoliaRecord('Meova_experiences', {
        objectID: data.id,
        title: data.title || '',
        category: data.category || '',
        price: data.price || 0,
        location: data.location || '',
        days: data.days || [],
        slots: data.slots || [],
        hostId: data.hostId || '',
        hostName: data.hostName || '',
        tags: data.tags || [],
        active: data.active !== false,
      });
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "user" or "experience"' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/algolia/sync]', err.message);
    // Non-fatal: return 200 so callers don't retry on Algolia errors
    return NextResponse.json({ success: false, message: err.message });
  }
}
