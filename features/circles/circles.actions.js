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

    const { data: circle } = await supabaseAdmin
      .from('circles')
      .select('member_count, members_count')
      .eq('id', circleId)
      .maybeSingle();

    if (circle) {
      const current = circle.member_count || circle.members_count || 1;
      await supabaseAdmin
        .from('circles')
        .update({
          member_count: current + 1,
          members_count: current + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', circleId);
    }

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

    const { data: circle } = await supabaseAdmin
      .from('circles')
      .select('member_count, members_count')
      .eq('id', circleId)
      .maybeSingle();

    if (circle) {
      const current = circle.member_count || circle.members_count || 1;
      const nextCount = Math.max(1, current - 1);
      await supabaseAdmin
        .from('circles')
        .update({
          member_count: nextCount,
          members_count: nextCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', circleId);
    }

    revalidatePath(`/circles`);
    revalidatePath(`/circles/${circleId}`);
    return { success: true };
  } catch (err) {
    console.error('leaveCircleAction error:', err);
    return { success: false, error: err.message };
  }
}
