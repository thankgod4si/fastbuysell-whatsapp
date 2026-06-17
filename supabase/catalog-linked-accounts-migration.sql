-- Add product catalog fields to linked Meta accounts
ALTER TABLE linked_accounts
  ADD COLUMN IF NOT EXISTS catalog_id text,
  ADD COLUMN IF NOT EXISTS catalog_name text;
