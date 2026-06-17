-- Run this in your Supabase SQL editor

create table contacts (
  id uuid default gen_random_uuid() primary key,
  phone text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'replied', 'blacklisted')),
  sent_at timestamptz,
  created_at timestamptz default now() not null
);

create table leads (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references contacts(id) on delete set null,
  phone text not null,
  full_name text not null,
  email text not null,
  car_make text not null,
  car_model text not null,
  car_year text not null,
  mileage text not null,
  asking_price text not null,
  previous_owners text not null,
  condition text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  email_sent_at timestamptz,
  created_at timestamptz default now() not null
);

-- If the leads table already exists, run this instead:
-- alter table leads add column if not exists email_sent_at timestamptz;

-- Email campaigns
create table campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  body text not null,
  reply_to text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed')),
  created_at timestamptz default now() not null
);

create table campaign_contacts (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns(id) on delete cascade not null,
  name text not null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz default now() not null,
  unique (campaign_id, email)
);

create table messages (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references contacts(id) on delete set null,
  phone text not null,
  type text not null,
  status text not null default 'sent',
  created_at timestamptz default now() not null
);

create table if not exists comment_triggers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  platform text not null check (platform in ('instagram', 'facebook')),
  page_id text,
  post_id text,
  link_url text not null,
  reply_template text not null default 'Thanks for commenting! Here is your link: {{link}}',
  active boolean default true,
  created_at timestamptz default now() not null
);
