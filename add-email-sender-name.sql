-- Add email sender name to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_sender_name text;
