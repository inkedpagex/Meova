'use server';

import { adminDb } from '../../lib/firebaseAdmin';
import { TABLE_CIRCLE_MEMBERS } from './constants';
import { getUserAdmin } from '../../lib/getUserAdmin';
import { revalidatePath } from 'next/cache';

export async function joinCircleAction(circleId) {
  try {
    const user = await getUserAdmin();
    if (!user) throw new Error('Unauthorized');
    if (!adminDb) throw new Error('DB unavailable');

    const memberId = `${circleId}_${user.id}`;
    await adminDb.collection(TABLE_CIRCLE_MEMBERS).doc(memberId).set({
      circle_id: circleId,
      user_id: user.id,
      created_at: new Date().toISOString()
    });

    revalidatePath(`/circles`);
    revalidatePath(`/circles/${circleId}`);
    return { success: true };
  } catch (err) {
    console.error('joinCircleAction error:', err);
    return { success: false, error: err.message };
  }
}

export async function leaveCircleAction(circleId) {
  try {
    const user = await getUserAdmin();
    if (!user) throw new Error('Unauthorized');
    if (!adminDb) throw new Error('DB unavailable');

    const memberId = `${circleId}_${user.id}`;
    await adminDb.collection(TABLE_CIRCLE_MEMBERS).doc(memberId).delete();

    revalidatePath(`/circles`);
    revalidatePath(`/circles/${circleId}`);
    return { success: true };
  } catch (err) {
    console.error('leaveCircleAction error:', err);
    return { success: false, error: err.message };
  }
}
