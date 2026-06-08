-- Run this in your Supabase SQL editor
-- Adds subscription management, usage tracking, and admin flag to profiles

alter table profiles
  add column if not exists subscription_status text default 'trial'
    check (subscription_status in ('trial', 'active', 'suspended'));

alter table profiles
  add column if not exists trial_sends_remaining integer default 10;

alter table profiles
  add column if not exists is_admin boolean default false;

alter table profiles
  add column if not exists messages_sent_total integer default 0;

alter table profiles
  add column if not exists last_sent_at timestamptz;

-- Atomic increment: updates total count, last_sent_at, and decrements trial allowance
-- Call this after every successful send instead of doing a read-modify-write in JS
create or replace function increment_message_count(user_id uuid, send_count int default 1)
returns void as $$
begin
  update profiles
  set
    messages_sent_total = coalesce(messages_sent_total, 0) + send_count,
    last_sent_at = now(),
    trial_sends_remaining = case
      when subscription_status = 'trial'
      then greatest(0, coalesce(trial_sends_remaining, 0) - send_count)
      else trial_sends_remaining
    end
  where id = user_id;
end;
$$ language plpgsql security definer;

-- To grant yourself admin access, run:
-- update profiles set is_admin = true where id = '<your-user-id>';
