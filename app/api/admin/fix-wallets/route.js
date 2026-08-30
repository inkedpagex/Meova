import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function GET() {
  try {
    let fixedWallets = 0;
    let rejectedCount = 0;

    // 1. Reset negative creator balances
    const { data: negativeWallets } = await supabaseAdmin
      .from('wallets')
      .select('user_id')
      .lt('creator', 0);

    if (negativeWallets && negativeWallets.length > 0) {
      for (const w of negativeWallets) {
        await supabaseAdmin
          .from('wallets')
          .update({ creator: 0, updated_at: new Date().toISOString() })
          .eq('user_id', w.user_id);
        fixedWallets++;
      }
    }

    // 2. Reject all pending withdrawals
    const { data: pendingWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('id')
      .eq('status', 'pending');

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      const now = new Date().toISOString();
      for (const wd of pendingWithdrawals) {
        await supabaseAdmin
          .from('withdrawals')
          .update({
            status: 'rejected',
            remarks: 'System upgrade: Please re-request your withdrawal to securely sync with our new Escrow system.',
            reviewed_at: now,
          })
          .eq('id', wd.id);
        rejectedCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      fixedWallets,
      rejectedCount,
      message: 'Data correction completed successfully.'
    });
  } catch (err) {
    console.error('Error during data correction:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
