-- Run in Supabase SQL Editor

alter table profiles add column if not exists stripe_customer_id      text;
alter table profiles add column if not exists stripe_subscription_id  text;
alter table profiles add column if not exists plan_id                 text default 'trial';
alter table profiles add column if not exists plan_messages_limit     int  default 50;
alter table profiles add column if not exists plan_period_end         timestamptz;

-- contacts: add user ownership + WhatsApp profile name + avatar
alter table contacts add column if not exists user_id   uuid references profiles(id) on delete cascade;
alter table contacts add column if not exists wa_name   text;
alter table contacts add column if not exists name      text;

-- message_logs: add direction + content for conversation threads
alter table message_logs add column if not exists direction   text default 'outbound' check (direction in ('outbound','inbound'));
alter table message_logs add column if not exists content     text;
alter table message_logs add column if not exists msg_type    text default 'template';
