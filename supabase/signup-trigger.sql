-- Run this in Supabase SQL Editor
-- Creates a trigger that automatically inserts a profile row whenever a new user signs up

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    subscription_status,
    is_admin,
    trial_sends_remaining,
    messages_sent_total
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
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
