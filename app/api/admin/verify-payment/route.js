import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { creditSparks } from '../../../../lib/wallet';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  let id, referenceCode, action;
  try {
    const body = await request.json();
    id = body.id;
    referenceCode = body.referenceCode;
    action = body.action;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if ((!id && !referenceCode) || !action) {
    return NextResponse.json({ error: 'id or referenceCode, and action required' }, { status: 400 });
  }

  try {
    let reqData;
    if (id) {
      const { data } = await supabaseAdmin.from('payment_requests').select('*').eq('id', id).maybeSingle();
      reqData = data;
    } else {
      const { data } = await supabaseAdmin.from('payment_requests').select('*').eq('reference_code', referenceCode).eq('status', 'pending').maybeSingle();
      reqData = data;
    }

    if (!reqData) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });

    const now = new Date().toISOString();

    if (action === 'reject') {
      if (reqData.status !== 'pending') {
        return NextResponse.json({ error: `Already ${reqData.status}` }, { status: 409 });
      }

      await supabaseAdmin
        .from('payment_requests')
        .update({ status: 'rejected', reviewed_at: now, admin_id: admin.uid })
        .eq('id', reqData.id);

      return NextResponse.json({ ok: true, message: 'Payment rejected successfully' });
    }

    if (action === 'approve') {
      if (reqData.status !== 'pending') {
        return NextResponse.json({ error: `Already ${reqData.status}` }, { status: 409 });
      }

      // Mark payment request as approved
      await supabaseAdmin
        .from('payment_requests')
        .update({ status: 'approved', reviewed_at: now, admin_id: admin.uid })
        .eq('id', reqData.id);

      // Credit sparks via creditSparks RPC
      await creditSparks(
        reqData.user_id,
        reqData.sparks,
        'purchased',
        'purchase',
        `Purchased ${reqData.pack_name || ''} pack`,
        reqData.id
      );

      // Notify user
      await supabaseAdmin.from('notifications').insert({
        user_id: reqData.user_id,
        sender_id: admin.uid,
        title: `⚡ ${reqData.sparks} Sparks Added!`,
        message: `Your payment of ₹${reqData.amount_inr || reqData.sparks} was approved. Sparks are now in your wallet!`,
        type: 'sparks',
        read: false,
        created_at: now,
      }).catch(() => {});

      return NextResponse.json({ ok: true, message: 'Payment approved successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    if (err.message?.startsWith('Already ')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
