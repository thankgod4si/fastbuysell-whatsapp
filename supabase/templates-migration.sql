-- Run in Supabase SQL Editor

-- User message templates (WhatsApp / Email / SMS)
create table if not exists templates (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references profiles(id) on delete cascade not null,
  channel       text not null check (channel in ('whatsapp', 'email', 'sms')),
  name          text not null,
  category      text default 'MARKETING',   -- WA: MARKETING | UTILITY | AUTHENTICATION
  language      text default 'en_US',
  header_text   text,                        -- WA optional header
  body          text not null,
  footer_text   text,                        -- WA optional footer
  subject       text,                        -- email subject line
  wa_template_name text,                     -- Meta slug (auto-generated, snake_case)
  wa_status     text default 'draft' check (wa_status in ('draft','pending','approved','rejected')),
  wa_reject_reason text,
  is_default    boolean default false,
  created_at    timestamptz default now()
);

-- Multiple WA numbers per user
create table if not exists wa_numbers (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references profiles(id) on delete cascade not null,
  phone_number_id text not null,
  phone_number    text not null,
  display_name    text,
  verified        boolean default false,
  is_default      boolean default false,
  created_at      timestamptz default now()
);

-- Migrate existing single WA number from profiles → wa_numbers
insert into wa_numbers (user_id, phone_number_id, phone_number, display_name, verified, is_default)
select id, wa_phone_number_id, wa_phone_number, wa_display_name, coalesce(wa_verified, false), true
from profiles
where wa_phone_number_id is not null
on conflict do nothing;

-- Enable RLS
alter table templates  enable row level security;
alter table wa_numbers enable row level security;

create policy "users manage own templates"  on templates  for all using (auth.uid() = user_id);
create policy "users manage own wa_numbers" on wa_numbers for all using (auth.uid() = user_id);
