-- Run this in Supabase SQL Editor
-- Fixes: credits always showing 0 — creates wallets + credit_transactions tables,
-- RPC functions, updated signup trigger, and seeds existing users.

-- ─── wallets table ──────────────────────────────────────────────────────────
create table if not exists public.wallets (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        not null unique references auth.users(id) on delete cascade,
  balance    int         not null default 0 check (balance >= 0),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─── credit_transactions table ──────────────────────────────────────────────
create table if not exists public.credit_transactions (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  amount        int         not null,
  type          text        not null default 'manual',
  description   text,
  balance_after int         not null default 0,
  created_at    timestamptz default now() not null
);

create index if not exists credit_transactions_user_idx
  on public.credit_transactions(user_id, created_at desc);

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.wallets enable row level security;
alter table public.credit_transactions enable row level security;

drop policy if exists "Users see own wallet"        on public.wallets;
drop policy if exists "Users see own transactions"  on public.credit_transactions;

create policy "Users see own wallet"
  on public.wallets for select using (auth.uid() = user_id);

create policy "Users see own transactions"
  on public.credit_transactions for select using (auth.uid() = user_id);

-- ─── add_credits(user_id, amount, description) ──────────────────────────────
create or replace function public.add_credits(
  p_user_id     uuid,
  p_amount      int,
  p_description text default 'Credit top-up'
)
returns void
language plpgsql security definer
as $$
declare
  v_balance int;
begin
  insert into public.wallets (user_id, balance, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update
    set balance    = wallets.balance + excluded.balance,
        updated_at = now()
  returning balance into v_balance;

  insert into public.credit_transactions (user_id, amount, type, description, balance_after)
  values (p_user_id, p_amount, 'topup', p_description, v_balance);
end;
$$;

-- ─── deduct_credits(user_id, amount) ────────────────────────────────────────
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount  int
)
returns void
language plpgsql security definer
as $$
declare
  v_balance int;
begin
  update public.wallets
  set balance    = greatest(0, balance - p_amount),
      updated_at = now()
  where user_id = p_user_id
  returning balance into v_balance;

  if v_balance is null then return; end if;

  insert into public.credit_transactions (user_id, amount, type, description, balance_after)
  values (p_user_id, -p_amount, 'usage', 'Message sent', v_balance);
end;
$$;

-- ─── increment_message_count(user_id, send_count) ───────────────────────────
create or replace function public.increment_message_count(
  user_id    uuid,
  send_count int default 1
)
returns void
language plpgsql security definer
as $$
begin
  update public.profiles
  set messages_sent_total   = coalesce(messages_sent_total, 0) + send_count,
      trial_sends_remaining = greatest(0, coalesce(trial_sends_remaining, 0) - send_count),
      last_sent_at          = now()
  where id = user_id;
end;
$$;

-- ─── Updated signup trigger: profile + wallet + free credit log ──────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (
    id, full_name, subscription_status, is_admin,
    trial_sends_remaining, messages_sent_total
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'pending_approval',
    false,
    10,
    0
  )
  on conflict (id) do nothing;

  -- Wallets are used for paid credits only. Trial sends are tracked separately in profiles.trial_sends_remaining.
  insert into public.wallets (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Seed wallets for existing users (one-time backfill) ────────────────────
-- Creates a wallet for every existing user using their trial_sends_remaining.
-- Safe to run multiple times (on conflict do nothing).
insert into public.wallets (user_id, balance)
select p.id, 0
from public.profiles p
where p.id not in (select user_id from public.wallets)
on conflict (user_id) do nothing;
