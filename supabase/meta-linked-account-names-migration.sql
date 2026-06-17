-- Add friendly display names for connected Meta channels
ALTER TABLE linked_accounts
  ADD COLUMN IF NOT EXISTS fb_page_name text,
  ADD COLUMN IF NOT EXISTS ig_username text,
  ADD COLUMN IF NOT EXISTS whatsapp_name text;
