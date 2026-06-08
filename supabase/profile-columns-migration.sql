-- Run this in Supabase SQL Editor
-- Adds all per-user config columns to the profiles table

alter table profiles add column if not exists resend_api_key    text;
alter table profiles add column if not exists email_from        text;
alter table profiles add column if not exists brevo_api_key     text;
alter table profiles add column if not exists brevo_sms_sender  text default 'FastBuySell';
alter table profiles add column if not exists wa_phone_number   text;
alter table profiles add column if not exists wa_phone_number_id text;
alter table profiles add column if not exists wa_display_name   text;
alter table profiles add column if not exists wa_verified       boolean default false;
alter table profiles add column if not exists reply_to_email    text;
alter table profiles add column if not exists full_name         text default '';
