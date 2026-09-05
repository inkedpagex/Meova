import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { autoExpireStaleReservations } from '@/lib/paymentReservations';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    await autoExpireStaleReservations();

    // 1. Try fetching from payment_reservations
    let payments = [];
    const { data: resData, error: resErr } = await supabaseAdmin
      .from('payment_reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!resErr && resData && resData.length > 0) {
      payments = resData;
    } else {
      // Fallback to legacy payment_requests
      const { data: reqData, error: reqErr } = await supabaseAdmin
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (reqErr) throw new Error(reqErr.message);
      payments = reqData || [];
    }

    const userIds = [...new Set(payments.map(p => p.user_id).filter(Boolean))];
    let profileMap = new Map();

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, photo_url, branch, year')
        .in('id', userIds);

      if (profiles) {
        profileMap = new Map(profiles.map(p => [p.id, p]));
      }
    }

    const now = Date.now();

    const enriched = payments.map(p => {
      const prof = profileMap.get(p.user_id) || {};
      const status = (p.status || 'pending').toLowerCase();
      
      let isExpired = status === 'expired';
      if (status === 'pending' && p.expires_at) {
        if (new Date(p.expires_at).getTime() < now) {
          isExpired = true;
        }
      }

      const finalAmount = Number(p.final_amount ?? p.amount_inr ?? p.rupees ?? 0);
      const baseAmount = Number(p.base_amount ?? p.sparks ?? Math.round(finalAmount));
      
      return {
        id: p.id,
        user_id: p.user_id,
        user_name: p.user_name || prof.full_name || 'Classmate',
        user_email: p.user_email || p.email || prof.email || 'No email',
        avatar_url: prof.photo_url || null,
        branch: prof.branch || null,
        year: prof.year || null,
        sparks: Number(p.sparks || 0),
        base_amount: baseAmount,
        amount_inr: finalAmount,
        final_amount: finalAmount,
        unique_decimal: p.unique_decimal || (finalAmount ? String(Math.round((finalAmount - Math.floor(finalAmount)) * 100)).padStart(2, '0') : null),
        reference_code: p.reference_code || p.utr_number || null,
        utr_number: p.utr_number || null,
        status: isExpired && status === 'pending' ? 'expired' : status,
        raw_status: status,
        pack_name: p.pack_name || `${p.sparks} Sparks`,
        pack_key: p.pack_key || null,
        created_at: p.created_at,
        expires_at: p.expires_at || null,
        claimed_at: p.claimed_at || null,
        approved_at: p.approved_at || p.reviewed_at || null,
        approved_by: p.approved_by || p.admin_id || null,
        rejection_reason: p.rejection_reason || null,
      };
    });

    return NextResponse.json({ payments: enriched });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
