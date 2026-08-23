import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserWithRole } from '@/lib/getAdminUser';

export async function GET(request) {
  try {
    if (!adminDb) return NextResponse.json({ gigs: [] });
    
    // Fetch gigs from newest to oldest
    const snap = await adminDb.collection('gigs').orderBy('createdAt', 'desc').get();
    
    const gigs = snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    return NextResponse.json({ gigs });
  } catch (err) {
    console.error('[GET /api/gigs]', err.message);
    return NextResponse.json({ gigs: [] });
  }
}

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { title, company, category, budget, duration, type, desc } = await request.json();
    
    if (!title || !desc) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const budgetNum = parseInt(budget, 10) || 0;
    if (budgetNum < 0 || budgetNum > 2000) {
      return NextResponse.json({ error: 'Reward must be between 0 and 2000 Sparks' }, { status: 400 });
    }

    // Verify wallet has enough Sparks
    const walletRef = adminDb.collection('wallets').doc(user.uid);
    const walletDoc = await walletRef.get();
    let currentSparks = 0;
    if (walletDoc.exists) {
      const wData = walletDoc.data();
      currentSparks = (wData.purchased || 0) + (wData.bonus || 0) + (wData.creator || 0);
    }
    if (budgetNum > currentSparks) {
      return NextResponse.json({ error: 'Insufficient Sparks in wallet' }, { status: 400 });
    }

    const newGig = {
      title,
      company: company || user.full_name || 'Campus Host',
      category: category || 'General',
      budget: String(budgetNum),
      duration: duration || 'Flexible',
      type: type || 'CAMPUS GIG',
      desc,
      authorId: user.uid,
      authorName: user.full_name || 'Host',
      createdAt: new Date().toISOString(),
      applicationsCount: 0,
    };

    const docRef = await adminDb.collection('gigs').add(newGig);
    
    return NextResponse.json({ ok: true, gig: { id: docRef.id, ...newGig } });
  } catch (err) {
    console.error('[POST /api/gigs]', err.message);
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 });
  }
}
