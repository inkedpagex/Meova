import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserWithRole } from '@/lib/getAdminUser';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request, { params }) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    const postRef = adminDb.collection('posts').doc(id);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // In a full production app, we would also add the user to a 'likedBy' array or subcollection
    // to prevent multiple likes from the same user. For now, we just increment the counter securely.
    await postRef.update({
      likes: FieldValue.increment(1)
    });

    return NextResponse.json({ ok: true, message: 'Post liked successfully', likes: (postSnap.data().likes || 0) + 1 });
  } catch (err) {
    console.error(`[POST /api/posts/${params.id}/like]`, err.message);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
