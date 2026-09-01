import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { logger } from '../../../../utils/logger';
import { sendAdminAlert } from '../../../../utils/alerts';
import { sanitizeText } from '../../../../lib/validations';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const withdrawalId = sanitizeText(body.withdrawalId, 64);
  const action = sanitizeText(body.action, 20);
  const remarks = sanitizeText(body.remarks || '', 200);

  if (!withdrawalId || !action) {
    return NextResponse.json({ error: 'withdrawalId and action required' }, { status: 400 });
  }

  // Fetch withdrawal
  const { data: wd, error: wdErr } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .maybeSingle();

  if (wdErr || !wd) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
  if (wd.status !== 'pending') {
    return NextResponse.json({ error: `Already ${wd.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const amount = Number(wd.amount || wd.sparks || 0);

  if (action === 'reject') {
    try {
      // Refund escrowed sparks back to creator wallet
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('creator')
        .eq('user_id', wd.user_id)
        .maybeSingle();

      await Promise.all([
        supabaseAdmin
          .from('wallets')
          .update({ creator: (wallet?.creator || 0) + amount, updated_at: now })
          .eq('user_id', wd.user_id),
        supabaseAdmin
          .from('withdrawals')
          .update({ status: 'rejected', admin_id: admin.uid, remarks, reviewed_at: now })
          .eq('id', withdrawalId),
      ]);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    logger.audit('WITHDRAWAL_REJECTED', admin.uid, { withdrawalId, targetUid: wd.user_id });
    return NextResponse.json({ ok: true });
  }

  if (action === 'approve') {
    try {
      // Fetch wallet to verify it exists
      const { data: wallet, error: walletErr } = await supabaseAdmin
        .from('wallets')
        .select('lifetime_withdrawn')
        .eq('user_id', wd.user_id)
        .maybeSingle();

      if (walletErr || !wallet) throw new Error('Wallet not found');

      // Sparks were already deducted during the request (Escrow)
      await Promise.all([
        supabaseAdmin
          .from('wallets')
          .update({
            lifetime_withdrawn: (wallet.lifetime_withdrawn || 0) + amount,
            updated_at: now,
          })
          .eq('user_id', wd.user_id),
        supabaseAdmin
          .from('withdrawals')
          .update({ status: 'approved', admin_id: admin.uid, remarks, approved_at: now })
          .eq('id', withdrawalId),
        supabaseAdmin.from('transactions').insert({
          user_id: wd.user_id,
          type: 'withdrawal',
          spark_type: 'creator',
          amount: -amount,
          status: 'completed',
          metadata: { withdrawal_id: withdrawalId, method: wd.method || 'UPI' },
          created_at: now,
        }),
        supabaseAdmin.from('audit_logs').insert({
          admin_id: admin.uid,
          action: 'APPROVE_WITHDRAWAL',
          target_uid: wd.user_id,
          old_value: { status: 'pending' },
          new_value: { status: 'approved', amount },
          timestamp: now,
        }),
      ]);
    } catch (err) {
      logger.error('Withdrawal approval failed', err, { withdrawalId, targetUid: wd.user_id });
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    logger.audit('WITHDRAWAL_APPROVED', admin.uid, {
      withdrawalId,
      targetUid: wd.user_id,
      amount,
    });

    sendAdminAlert({
      title: 'Withdrawal Approved',
      message: `Admin approved payout of ${amount} Sparks for user ${wd.upi_id || wd.user_id}`,
      fields: [
        { name: 'Withdrawal ID', value: withdrawalId },
        { name: 'Sparks', value: amount },
        { name: 'UPI', value: wd.upi_id || 'N/A' },
      ],
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
