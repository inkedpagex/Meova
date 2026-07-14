'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import { getUserAdmin } from '@/lib/getAdminUser';

export async function sendMessageAction(messageData: {
  recipientName: string;
  sender: 'user' | 'character';
  text: string;
}) {
  try {
    const user = await getUserAdmin();
    if (!user) throw new Error('Unauthorized');
    if (!adminDb) throw new Error('DB unavailable');

    await adminDb.collection('chats').add({
      senderId: user.id,
      recipientName: messageData.recipientName,
      sender: messageData.sender,
      text: messageData.text,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (err: any) {
    console.error('sendMessageAction error:', err);
    return { success: false, error: err.message };
  }
}
