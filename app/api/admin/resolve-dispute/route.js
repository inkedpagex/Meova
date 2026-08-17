import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { bookingId, action } = await request.json(); // action: 'refund' or 'pay'
    if (!bookingId || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    
    await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(bookingRef);
      if (!doc.exists) throw new Error('Booking not found');
      
      const booking = doc.data();
      if (booking.status !== 'Disputed') throw new Error('Booking is not in disputed status');

      const amount = booking.amount || 50;

      if (action === 'refund') {
        const guestWalletRef = adminDb.collection('wallets').doc(booking.guestId);
        const guestWalletSnap = await tx.get(guestWalletRef);
        const guestWallet = guestWalletSnap.exists ? guestWalletSnap.data() : { purchased: 0, bonus: 0, creator: 0 };
        
        tx.set(guestWalletRef, {
          ...guestWallet,
          purchased: (guestWallet.purchased || 0) + amount,
          updated_at: new Date().toISOString()
        });
        
        tx.update(bookingRef, { status: 'Refunded' });
        
        // Notify guest
        const notifRef = adminDb.collection('users').doc(booking.guestId).collection('notifications').doc();
        tx.set(notifRef, {
          title: 'Dispute Resolved (Refunded)',
          message: `Your dispute for booking with ${booking.hostName} was resolved in your favor. ${amount} Sparks have been refunded.`,
          type: 'alert',
          read: false,
          created_at: new Date().toISOString()
        });
      } else if (action === 'pay') {
        const hostWalletRef = adminDb.collection('wallets').doc(booking.hostId);
        const hostWalletSnap = await tx.get(hostWalletRef);
        const hostWallet = hostWalletSnap.exists ? hostWalletSnap.data() : { purchased: 0, bonus: 0, creator: 0 };
        
        tx.set(hostWalletRef, {
          ...hostWallet,
          creator: (hostWallet.creator || 0) + amount,
          updated_at: new Date().toISOString()
        });

        tx.update(bookingRef, { status: 'Completed' });

        // Notify host
        const notifRef = adminDb.collection('users').doc(booking.hostId).collection('notifications').doc();
        tx.set(notifRef, {
          title: 'Dispute Resolved (Paid)',
          message: `The dispute for a booking by ${booking.guestName} was resolved in your favor. ${amount} Sparks have been credited.`,
          type: 'alert',
          read: false,
          created_at: new Date().toISOString()
        });
      } else {
        throw new Error('Invalid action');
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
