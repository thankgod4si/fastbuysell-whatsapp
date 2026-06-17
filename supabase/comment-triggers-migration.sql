-- Run in Supabase SQL editor

create table if not exists comment_triggers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  platform text not null check (platform in ('instagram', 'facebook')),
  page_id text,
  post_id text not null,
  link_url text not null,
  reply_template text not null default 'Thanks for commenting! Here is your link: {{link}}',
  active boolean default true,
  created_at timestamptz default now() not null
);

alter table comment_triggers enable row level security;
create policy "users manage own comment triggers" on comment_triggers for all using (auth.uid() = user_id);
