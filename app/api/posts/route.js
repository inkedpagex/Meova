import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserWithRole } from '@/lib/getAdminUser';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!adminDb) return NextResponse.json({ posts: [] });
    const snap = await adminDb.collection('posts').orderBy('createdAt', 'desc').limit(20).get();
    const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ posts });
  } catch (err) {
    console.error('[GET /api/posts]', err.message);
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { photoUrl, caption, location, category } = await request.json();
    if (!photoUrl) return NextResponse.json({ error: 'Photo is required' }, { status: 400 });

    const newPost = {
      authorId: user.uid,
      authorName: user.full_name || 'Campus Peer',
      authorPhoto: user.photo_url || null,
      authorBranch: user.branch || 'GLA Student',
      photoUrl,
      caption: caption || '',
      location: location || 'Campus',
      category: category || 'Food & Meets',
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('posts').add(newPost);
    return NextResponse.json({ ok: true, post: { id: docRef.id, ...newPost } });
  } catch (err) {
    console.error('[POST /api/posts]', err.message);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
