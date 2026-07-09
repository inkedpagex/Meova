// Handles all Firebase database calls for the Events feature from the client.
import { db } from '../../lib/firebaseClient';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { TABLE_RSVPS } from './constants';

export async function rsvpToEvent(eventId, userId) {
  const rsvpId = `${eventId}_${userId}`;
  await setDoc(doc(db, TABLE_RSVPS, rsvpId), {
    event_id: eventId,
    user_id: userId,
    created_at: new Date().toISOString()
  });
  return true;
}

export async function cancelRsvp(eventId, userId) {
  const rsvpId = `${eventId}_${userId}`;
  await deleteDoc(doc(db, TABLE_RSVPS, rsvpId));
  return true;
}
