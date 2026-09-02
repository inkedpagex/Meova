import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });

  try {
    const { targetUid } = await request.json();

    if (!targetUid) {
      return NextResponse.json({ error: 'targetUid is required.' }, { status: 400 });
    }

    // 1. Fetch target user profile
    const { data: targetProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', targetUid)
      .maybeSingle();

    if (profileErr || !targetProfile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    // 2. Protect Admins & Super Admins
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const targetEmail = (targetProfile.email || '').toLowerCase();

    if (
      targetProfile.role === 'admin' ||
      targetUid === admin.uid ||
      targetEmail === 'chirag2006chak@gmail.com' ||
      adminEmails.includes(targetEmail)
    ) {
      return NextResponse.json({ error: 'Cannot delete protected administrator accounts.' }, { status: 400 });
    }

    console.log(`[Admin Delete User] Purging all data for user ${targetUid} (${targetEmail})...`);

    // 3. Cascade delete associated records across all tables
    await Promise.allSettled([
      // Claimed username
      targetProfile.username ? supabaseAdmin.from('usernames').delete().eq('username', targetProfile.username) : Promise.resolve(),
      supabaseAdmin.from('usernames').delete().eq('user_id', targetUid),

      // User posts, comments, likes
      supabaseAdmin.from('posts').delete().eq('author_id', targetUid),
      supabaseAdmin.from('comments').delete().eq('author_id', targetUid),
      supabaseAdmin.from('likes').delete().eq('user_id', targetUid),

      // Gigs & Applications
      supabaseAdmin.from('gigs').delete().eq('author_id', targetUid),
      supabaseAdmin.from('applications').delete().eq('user_id', targetUid),

      // Circle memberships & owned circles
      supabaseAdmin.from('circle_members').delete().eq('user_id', targetUid),
      supabaseAdmin.from('circles').delete().eq('creator_id', targetUid),

      // Wallets & Transactions
      supabaseAdmin.from('wallets').delete().eq('user_id', targetUid),
      supabaseAdmin.from('wallet_transactions').delete().eq('user_id', targetUid),

      // Notifications & Blocks
      supabaseAdmin.from('notifications').delete().eq('user_id', targetUid),
      supabaseAdmin.from('blocks').delete().eq('blocker_id', targetUid),
      supabaseAdmin.from('blocks').delete().eq('blocked_id', targetUid),

      // Bookings & Reviews
      supabaseAdmin.from('bookings').delete().eq('host_id', targetUid),
      supabaseAdmin.from('bookings').delete().eq('guest_id', targetUid),
      supabaseAdmin.from('reviews').delete().eq('reviewer_id', targetUid),
      supabaseAdmin.from('reviews').delete().eq('target_user_id', targetUid),
    ]);

    // 4. Delete profile record
    await supabaseAdmin.from('profiles').delete().eq('id', targetUid);

    // 5. Delete from Supabase Auth User Registry
    try {
      await supabaseAdmin.auth.admin.deleteUser(targetUid);
    } catch (authErr) {
      console.warn('[Admin Delete User] Supabase auth delete warning:', authErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetProfile.full_name || targetEmail} and all associated data permanently deleted.`,
    });
  } catch (err) {
    console.error('[Admin Delete User error]', err);
    return NextResponse.json({ error: err.message || 'Failed to delete user.' }, { status: 500 });
  }
}
