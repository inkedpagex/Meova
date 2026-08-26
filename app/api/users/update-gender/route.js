import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__Meova_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid;
    try {
      const decoded = await adminAuth.verifyIdToken(sessionCookie);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { gender } = body;

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({ error: 'Please select a valid gender option.' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized.' }, { status: 500 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    await userRef.update({
      gender,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, gender });
  } catch (error) {
    console.error('Update gender error:', error);
    return NextResponse.json({ error: 'Failed to update gender.' }, { status: 500 });
  }
}
