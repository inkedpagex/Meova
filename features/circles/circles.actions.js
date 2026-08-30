'use server';

import { supabaseAdmin } from '../../lib/supabase/admin';
import { getUserAdmin } from '../../lib/getUserAdmin';
import { revalidatePath } from 'next/cache';

export async function joinCircleAction(circleId) {
  try {
    const user = await getUserAdmin();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabaseAdmin
      .from('circle_members')
      .upsert({
        circle_id: circleId,
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString()
      }, { onConflict: 'circle_id,user_id' });

    if (error) throw new Error(error.message);

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

    const { error } = await supabaseAdmin
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    revalidatePath(`/circles`);
    revalidatePath(`/circles/${circleId}`);
    return { success: true };
  } catch (err) {
    console.error('leaveCircleAction error:', err);
    return { success: false, error: err.message };
  }
}
