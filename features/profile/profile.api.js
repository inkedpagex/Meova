// Handles all Firebase database calls for the Profile feature from the client.
import { db } from '../../lib/firebaseClient';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { TABLE_PROFILES, TABLE_CIRCLE_MEMBERS } from './constants';

export async function fetchProfile(userId) {
  const docRef = doc(db, TABLE_PROFILES, userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Profile not found');
  return { id: docSnap.id, ...docSnap.data() };
}

export async function updateProfile(userId, updates) {
  const docRef = doc(db, TABLE_PROFILES, userId);
  await updateDoc(docRef, updates);
  return true;
}

export async function fetchJoinedCircles(userId) {
  const q = query(collection(db, TABLE_CIRCLE_MEMBERS), where("user_id", "==", userId));
  const querySnapshot = await getDocs(q);
  
  const circleIds = querySnapshot.docs.map(d => d.data().circle_id);
  
  if (circleIds.length === 0) return [];

  // Note: For a production app, use in queries or fetch individually
  // Here we'll fetch them individually for simplicity
  const circles = await Promise.all(
    circleIds.map(async (cid) => {
      const cSnap = await getDoc(doc(db, 'circles', cid));
      return cSnap.exists() ? { id: cSnap.id, ...cSnap.data() } : null;
    })
  );

  return circles.filter(Boolean);
}
