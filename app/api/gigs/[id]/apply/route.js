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
    if (!id) return NextResponse.json({ error: 'Gig ID is required' }, { status: 400 });

    const gigRef = adminDb.collection('gigs').doc(id);
    const gigSnap = await gigRef.get();

    if (!gigSnap.exists) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    // Save the application in a subcollection
    const applicationRef = gigRef.collection('applications').doc(user.uid);
    const appSnap = await applicationRef.get();
    
    if (appSnap.exists) {
       return NextResponse.json({ error: 'Already applied' }, { status: 400 });
    }

    const batch = adminDb.batch();
    
    // 1. Create the application document
    batch.set(applicationRef, {
      applicantId: user.uid,
      applicantName: user.full_name || 'Student',
      applicantBranch: user.branch || 'Campus',
      status: 'PENDING',
      appliedAt: new Date().toISOString()
    });

    // 2. Increment the application count on the gig
    batch.update(gigRef, {
      applicationsCount: FieldValue.increment(1)
    });

    await batch.commit();

    return NextResponse.json({ ok: true, message: 'Application submitted successfully' });
  } catch (err) {
    console.error(`[POST /api/gigs/${params.id}/apply]`, err.message);
    return NextResponse.json({ error: 'Failed to apply to gig' }, { status: 500 });
  }
}
