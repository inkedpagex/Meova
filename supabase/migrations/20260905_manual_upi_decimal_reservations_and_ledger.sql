-- ==============================================================================
-- Migration: Manual UPI Payment Verification System & Secure Wallet Ledger
-- ==============================================================================

-- 1. Create payment_reservations table
CREATE TABLE IF NOT EXISTS public.payment_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  base_amount NUMERIC(10, 2) NOT NULL,
  final_amount NUMERIC(10, 2) NOT NULL,
  sparks INTEGER NOT NULL,
  pack_key TEXT,
  pack_name TEXT,
  reference_code TEXT,
  upi_id TEXT,
  utr_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid_claimed', 'approved', 'expired', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  claimed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejection_reason TEXT,
  user_email TEXT,
  user_name TEXT,
  metadata JSONB
);

-- 2. Create partial unique index on final_amount for active (pending / paid_claimed) reservations
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_reservations_active_amount
ON public.payment_reservations (final_amount)
WHERE status IN ('pending', 'paid_claimed');

-- 3. Create index for fast user & status lookups
CREATE INDEX IF NOT EXISTS idx_payment_reservations_user_status
ON public.payment_reservations (user_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_reservations_expires_at
ON public.payment_reservations (expires_at)
WHERE status = 'pending';

-- 4. Create immutable wallet_transactions ledger table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recharge_approved', 'spend', 'refund', 'admin_adjustment', 'withdrawal', 'bonus', 'welcome', 'transfer', 'tip')),
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB
);

-- 5. Create index for user transaction history and balance aggregation
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id
ON public.wallet_transactions (user_id, created_at DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.payment_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 7. Function to calculate derived ledger balance
CREATE OR REPLACE FUNCTION public.get_ledger_wallet_balance(p_user_id TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM public.wallet_transactions
  WHERE user_id = p_user_id;

  RETURN v_balance;
END;
$$;

-- 8. Atomic stored procedure for payment reservation approval and ledger credit
CREATE OR REPLACE FUNCTION public.approve_payment_reservation(
  p_reservation_id UUID,
  p_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_new_balance NUMERIC;
BEGIN
  SELECT * INTO v_res
  FROM public.payment_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Reservation not found');
  END IF;

  IF v_res.status NOT IN ('pending', 'paid_claimed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Reservation is already ' || v_res.status);
  END IF;

  UPDATE public.payment_reservations
  SET
    status = 'approved',
    approved_at = v_now,
    approved_by = p_admin_id
  WHERE id = p_reservation_id;

  INSERT INTO public.wallet_transactions (
    user_id,
    amount,
    type,
    description,
    reference_id,
    created_at,
    created_by,
    metadata
  ) VALUES (
    v_res.user_id,
    v_res.sparks,
    'recharge_approved',
    'Recharge Approved: ' || COALESCE(v_res.pack_name, v_res.sparks || ' Sparks') || ' (Paid ₹' || v_res.final_amount || ')',
    v_res.id::text,
    v_now,
    p_admin_id,
    jsonb_build_object(
      'base_amount', v_res.base_amount,
      'final_amount', v_res.final_amount,
      'reference_code', v_res.reference_code,
      'pack_key', v_res.pack_key
    )
  );

  UPDATE public.wallets
  SET
    purchased = COALESCE(purchased, 0) + v_res.sparks,
    lifetime_purchased = COALESCE(lifetime_purchased, 0) + v_res.sparks,
    updated_at = v_now
  WHERE user_id = v_res.user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_new_balance
  FROM public.wallet_transactions
  WHERE user_id = v_res.user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'reservation_id', p_reservation_id,
    'user_id', v_res.user_id,
    'sparks_credited', v_res.sparks,
    'final_amount', v_res.final_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- 9. pg_cron background auto-expiry job (runs every 1 minute)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'expire-stale-payment-reservations',
      '* * * * *',
      $$ UPDATE public.payment_reservations SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW(); $$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available or schedule already exists';
END;
$$;
