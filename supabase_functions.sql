-- ============================================================================
-- MEETIFY — Atomic Wallet RPC Functions
-- Run this in your Supabase SQL Editor AFTER supabase_schema.sql
-- These replace Firestore's runTransaction() logic for lib/wallet.js
-- ============================================================================

-- ----------------------------------------------------------------------------
-- spend_sparks
-- Cascading deduction: purchased -> bonus -> creator (same order as the
-- original Firestore transaction). Locks the wallet row to prevent race
-- conditions from concurrent spends (e.g. double-booking, double gig-apply).
-- ----------------------------------------------------------------------------
create or replace function public.spend_sparks(
  p_user_id      text,
  p_amount       numeric,
  p_description  text,
  p_type         text default 'booking_escrow',
  p_reference_id text default null
)
returns public.wallets
language plpgsql
security definer -- runs with elevated privileges; call only from server (service_role) or trusted RPC context
as $$
declare
  v_wallet        public.wallets;
  v_remaining     numeric := p_amount;
  v_from_purchased numeric := 0;
  v_from_bonus     numeric := 0;
  v_from_creator   numeric := 0;
begin
  if p_amount <= 0 then
    raise exception 'spend_sparks: amount must be positive';
  end if;

  -- Lock the wallet row so concurrent spends can't overdraw it
  select * into v_wallet
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'spend_sparks: wallet not found for user %', p_user_id;
  end if;

  if (v_wallet.purchased + v_wallet.bonus + v_wallet.creator) < p_amount then
    raise exception 'spend_sparks: insufficient balance for user % (has %, needs %)',
      p_user_id, (v_wallet.purchased + v_wallet.bonus + v_wallet.creator), p_amount;
  end if;

  -- Cascade: purchased first
  v_from_purchased := least(v_wallet.purchased, v_remaining);
  v_remaining := v_remaining - v_from_purchased;

  -- then bonus
  if v_remaining > 0 then
    v_from_bonus := least(v_wallet.bonus, v_remaining);
    v_remaining := v_remaining - v_from_bonus;
  end if;

  -- then creator
  if v_remaining > 0 then
    v_from_creator := least(v_wallet.creator, v_remaining);
    v_remaining := v_remaining - v_from_creator;
  end if;

  update public.wallets
  set purchased   = purchased - v_from_purchased,
      bonus       = bonus - v_from_bonus,
      creator     = creator - v_from_creator,
      updated_at  = now()
  where user_id = p_user_id
  returning * into v_wallet;

  insert into public.transactions (user_id, type, amount, description, status, reference_id)
  values (p_user_id, p_type, -p_amount, p_description, 'COMPLETED', p_reference_id);

  return v_wallet;
end;
$$;

-- ----------------------------------------------------------------------------
-- credit_sparks
-- Atomically credits a wallet bucket (purchased / bonus / creator) and
-- updates the matching lifetime counter, then logs a transaction.
-- ----------------------------------------------------------------------------
create or replace function public.credit_sparks(
  p_user_id      text,
  p_amount       numeric,
  p_bucket       text,      -- 'purchased' | 'bonus' | 'creator'
  p_type         text,      -- 'bonus' | 'purchase' | 'gig_payout' | 'booking_payout' | 'tip' | 'dispute_refund'
  p_description  text,
  p_reference_id text default null
)
returns public.wallets
language plpgsql
security definer
as $$
declare
  v_wallet public.wallets;
begin
  if p_amount <= 0 then
    raise exception 'credit_sparks: amount must be positive';
  end if;

  if p_bucket not in ('purchased','bonus','creator') then
    raise exception 'credit_sparks: invalid bucket %', p_bucket;
  end if;

  -- Ensure wallet exists (create with defaults if missing, mirrors getOrCreateWallet)
  insert into public.wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  if p_bucket = 'purchased' then
    update public.wallets
    set purchased = purchased + p_amount,
        lifetime_purchased = lifetime_purchased + p_amount,
        updated_at = now()
    where user_id = p_user_id
    returning * into v_wallet;

  elsif p_bucket = 'bonus' then
    update public.wallets
    set bonus = bonus + p_amount,
        updated_at = now()
    where user_id = p_user_id
    returning * into v_wallet;

  elsif p_bucket = 'creator' then
    update public.wallets
    set creator = creator + p_amount,
        lifetime_earned = lifetime_earned + p_amount,
        updated_at = now()
    where user_id = p_user_id
    returning * into v_wallet;
  end if;

  insert into public.transactions (user_id, type, amount, description, status, reference_id)
  values (p_user_id, p_type, p_amount, p_description, 'COMPLETED', p_reference_id);

  return v_wallet;
end;
$$;

-- ----------------------------------------------------------------------------
-- record_withdrawal_payout
-- Called when an admin approves a withdrawal: moves sparks out of `creator`
-- and bumps lifetime_withdrawn, all atomically.
-- ----------------------------------------------------------------------------
create or replace function public.record_withdrawal_payout(
  p_user_id  text,
  p_amount   numeric,
  p_withdrawal_id text
)
returns public.wallets
language plpgsql
security definer
as $$
declare
  v_wallet public.wallets;
begin
  select * into v_wallet from public.wallets where user_id = p_user_id for update;

  if not found or v_wallet.creator < p_amount then
    raise exception 'record_withdrawal_payout: insufficient creator balance for user %', p_user_id;
  end if;

  update public.wallets
  set creator = creator - p_amount,
      lifetime_withdrawn = lifetime_withdrawn + p_amount,
      updated_at = now()
  where user_id = p_user_id
  returning * into v_wallet;

  insert into public.transactions (user_id, type, amount, description, status, reference_id)
  values (p_user_id, 'withdrawal', -p_amount, 'Withdrawal approved', 'COMPLETED', p_withdrawal_id);

  return v_wallet;
end;
$$;

-- Revoke public permissions & grant to service_role
revoke execute on function public.spend_sparks from public, anon, authenticated;
revoke execute on function public.credit_sparks from public, anon, authenticated;
revoke execute on function public.record_withdrawal_payout from public, anon, authenticated;

grant execute on function public.spend_sparks to service_role;
grant execute on function public.credit_sparks to service_role;
grant execute on function public.record_withdrawal_payout to service_role;
