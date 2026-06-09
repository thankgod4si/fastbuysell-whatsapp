-- Run in Supabase SQL Editor

-- Patch leads table with missing columns
alter table leads alter column full_name      drop not null;
alter table leads alter column email          drop not null;
alter table leads alter column car_make       drop not null;
alter table leads alter column car_model      drop not null;
alter table leads alter column car_year       drop not null;
alter table leads alter column mileage        drop not null;
alter table leads alter column asking_price   drop not null;
alter table leads alter column previous_owners drop not null;
alter table leads add column if not exists notes     text;
alter table leads add column if not exists source    text default 'whatsapp';
alter table leads add column if not exists user_id   uuid references profiles(id) on delete set null;

create table if not exists flows (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references profiles(id) on delete cascade not null,
  name          text not null,
  screen_title  text not null default 'Your Details',
  cta_text      text not null default 'Submit',
  fields        jsonb not null default '[]', -- array of { key, label, type, required, options? }
  meta_flow_id  text,
  meta_status   text default 'draft' check (meta_status in ('draft','published','deprecated')),
  created_at    timestamptz default now()
);

-- link templates to an optional flow
alter table templates add column if not exists flow_id uuid references flows(id) on delete set null;
alter table templates add column if not exists flow_cta text default 'Fill Form';

alter table flows enable row level security;
create policy "users manage own flows" on flows for all using (auth.uid() = user_id);
