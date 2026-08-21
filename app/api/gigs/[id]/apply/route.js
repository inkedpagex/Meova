import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserWithRole } from '@/lib/getAdminUser';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request, { params }) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Gig ID is required' }, { status: 400 });

    const gigRef = adminDb.collection('gigs').doc(id);
    const gigSnap = await gigRef.get();

    if (!gigSnap.exists) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    const gig = gigSnap.data();

    // Can't apply to your own gig
    if (gig.authorId === user.uid) {
      return NextResponse.json({ error: 'You cannot apply to your own gig' }, { status: 400 });
    }

    // Can't apply to closed/expired gig
    if (gig.status === 'closed' || gig.status === 'expired') {
      return NextResponse.json({ error: 'This gig is no longer accepting applications' }, { status: 400 });
    }

    // Check for duplicate application
    const applicationRef = gigRef.collection('applications').doc(user.uid);
    const appSnap = await applicationRef.get();
    if (appSnap.exists) {
      return NextResponse.json({ error: 'Already applied to this gig' }, { status: 400 });
    }

    const { pitch } = await request.json().catch(() => ({}));

    const batch = adminDb.batch();

    // 1. Create the application document (with optional pitch message)
    batch.set(applicationRef, {
      applicantId: user.uid,
      applicantName: user.full_name || 'Student',
      applicantPhoto: user.photo_url || '',
      applicantUsername: user.username || '',
      applicantBranch: user.branch || 'Campus',
      pitch: (pitch || '').trim().slice(0, 300),
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
    });

    // 2. Increment the application count on the gig
    batch.update(gigRef, {
      applicationsCount: FieldValue.increment(1),
    });

    await batch.commit();

    // Notify gig author
    adminDb.collection('users').doc(gig.authorId).collection('notifications').add({
      title: 'New Gig Application ⚡',
      body: `${user.full_name || 'Someone'} applied to your gig "${gig.title}"`,
      type: 'gig_application',
      gigId: id,
      read: false,
      created_at: FieldValue.serverTimestamp(),
    }).catch(() => {});

    return NextResponse.json({ ok: true, message: 'Application submitted successfully' });
  } catch (err) {
    console.error(`[POST /api/gigs/[id]/apply]`, err.message);
    return NextResponse.json({ error: 'Failed to apply to gig' }, { status: 500 });
  }
}
