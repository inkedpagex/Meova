'use server';

import { supabaseAdmin } from '../../lib/supabase/admin';
import { getUserAdmin } from '../../lib/getUserAdmin';
import { revalidatePath } from 'next/cache';

export async function rsvpToEventAction(eventId) {
  try {
    const user = await getUserAdmin();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabaseAdmin
      .from('rsvps')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        status: 'going',
        created_at: new Date().toISOString()
      }, { onConflict: 'event_id,user_id' });

    if (error) throw new Error(error.message);

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

    const { error } = await supabaseAdmin
      .from('rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    revalidatePath(`/events`);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error('cancelRsvpAction error:', err);
    return { success: false, error: err.message };
  }
}
