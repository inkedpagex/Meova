// Handles all Firebase database calls for the Circles feature from the client.
import { db } from '../../lib/firebaseClient';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { TABLE_CIRCLE_MEMBERS } from './constants';

export async function joinCircle(circleId, userId) {
  const memberId = `${circleId}_${userId}`;
  await setDoc(doc(db, TABLE_CIRCLE_MEMBERS, memberId), {
    circle_id: circleId,
    user_id: userId,
    created_at: new Date().toISOString()
  });
  return true;
}

export async function leaveCircle(circleId, userId) {
  const memberId = `${circleId}_${userId}`;
  await deleteDoc(doc(db, TABLE_CIRCLE_MEMBERS, memberId));
  return true;
}
