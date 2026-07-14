'use server';

import { adminDb } from '../../lib/firebaseAdmin';
import { TABLE_RSVPS } from './constants';
import { getUserAdmin } from '../../lib/getUserAdmin';
import { revalidatePath } from 'next/cache';

export async function rsvpToEventAction(eventId) {
  try {
    const user = await getUserAdmin();
    if (!user) throw new Error('Unauthorized');
    if (!adminDb) throw new Error('DB unavailable');

    const rsvpId = `${eventId}_${user.id}`;
    await adminDb.collection(TABLE_RSVPS).doc(rsvpId).set({
      event_id: eventId,
      user_id: user.id,
      created_at: new Date().toISOString()
    });

    revalidatePath(`/events`);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error('rsvpToEventAction error:', err);
    return { success: false, error: err.message };
  }
}

export async function cancelRsvpAction(eventId) {
  try {
    const user = await getUserAdmin();
    if (!user) throw new Error('Unauthorized');
    if (!adminDb) throw new Error('DB unavailable');

    const rsvpId = `${eventId}_${user.id}`;
    await adminDb.collection(TABLE_RSVPS).doc(rsvpId).delete();

    revalidatePath(`/events`);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error('cancelRsvpAction error:', err);
    return { success: false, error: err.message };
  }
}
