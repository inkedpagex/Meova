/**
 * lib/supabaseQueries.js
 * Server-side Supabase queries for Next.js Server Components and API routes.
 */
import { supabaseAdmin } from './supabase/admin';

// ─── Users & Profiles ────────────────────────────────────────────────────────

export async function fetchUsersAdmin(limitCount = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .neq('is_blocked', true)
      .neq('status', 'blocked')
      .limit(limitCount);

    if (error) {
      console.error('[fetchUsersAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchUsersAdmin]', err.message);
    return [];
  }
}

export async function fetchProfileAdmin(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[fetchProfileAdmin]', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[fetchProfileAdmin]', err.message);
    return null;
  }
}

// ─── Circles ─────────────────────────────────────────────────────────────────

export async function fetchCirclesAdmin(limitCount = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from('circles')
      .select('*')
      .neq('status', 'pending_approval')
      .limit(limitCount);

    if (error) {
      console.error('[fetchCirclesAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchCirclesAdmin]', err.message);
    return [];
  }
}

export async function fetchPendingCirclesAdmin() {
  try {
    const { data, error } = await supabaseAdmin
      .from('circles')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchPendingCirclesAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchPendingCirclesAdmin]', err.message);
    return [];
  }
}

export async function fetchCircleDetailAdmin(circleId) {
  if (!circleId) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('circles')
      .select('*')
      .eq('id', circleId)
      .maybeSingle();

    if (error) {
      console.error('[fetchCircleDetailAdmin]', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[fetchCircleDetailAdmin]', err.message);
    return null;
  }
}

export async function fetchCircleMembersAdmin(circleId) {
  if (!circleId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('circle_members')
      .select('*')
      .eq('circle_id', circleId);

    if (error) {
      console.error('[fetchCircleMembersAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchCircleMembersAdmin]', err.message);
    return [];
  }
}

export async function fetchCircleEventsAdmin(circleId) {
  if (!circleId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('circle_id', circleId);

    if (error) {
      console.error('[fetchCircleEventsAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchCircleEventsAdmin]', err.message);
    return [];
  }
}

export async function fetchJoinedCirclesAdmin(userId) {
  if (!userId) return [];
  try {
    const { data: memberships, error: memErr } = await supabaseAdmin
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', userId);

    if (memErr || !memberships || !memberships.length) return [];

    const circleIds = memberships.map(m => m.circle_id).filter(Boolean);
    if (!circleIds.length) return [];

    const { data: circles, error: circErr } = await supabaseAdmin
      .from('circles')
      .select('*')
      .in('id', circleIds);

    if (circErr) {
      console.error('[fetchJoinedCirclesAdmin]', circErr.message);
      return [];
    }

    return circles || [];
  } catch (err) {
    console.error('[fetchJoinedCirclesAdmin]', err.message);
    return [];
  }
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function fetchUpcomingEventsAdmin(limitCount = 12) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(limitCount);

    if (error) {
      console.error('[fetchUpcomingEventsAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchUpcomingEventsAdmin]', err.message);
    return [];
  }
}

// ─── Experiences ─────────────────────────────────────────────────────────────

export async function fetchExperiencesAdmin(limitCount = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from('experiences')
      .select('*')
      .neq('active', false)
      .limit(limitCount);

    if (error) {
      console.error('[fetchExperiencesAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchExperiencesAdmin]', err.message);
    return [];
  }
}

export async function fetchUserExperiencesAdmin(hostId) {
  if (!hostId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('experiences')
      .select('*')
      .eq('host_id', hostId);

    if (error) {
      console.error('[fetchUserExperiencesAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchUserExperiencesAdmin]', err.message);
    return [];
  }
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchUserBookingsAdmin(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .or(`guest_id.eq.${userId},host_id.eq.${userId}`);

    if (error) {
      console.error('[fetchUserBookingsAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchUserBookingsAdmin]', err.message);
    return [];
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotificationsAdmin(userId, limitCount = 30) {
  if (!userId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('[fetchNotificationsAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchNotificationsAdmin]', err.message);
    return [];
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function fetchReviewsAdmin(targetUserId, limitCount = 20) {
  if (!targetUserId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('target_user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('[fetchReviewsAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchReviewsAdmin]', err.message);
    return [];
  }
}

// ─── Posts & Moments ──────────────────────────────────────────────────────────

export async function fetchUserPostsAdmin(userId, limitCount = 20) {
  if (!userId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('[fetchUserPostsAdmin]', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchUserPostsAdmin]', err.message);
    return [];
  }
}
