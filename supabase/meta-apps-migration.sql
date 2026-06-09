-- Multi-WABA support: platform owner registers multiple Meta Business Apps
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS meta_apps (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  waba_id      text NOT NULL,
  access_token text NOT NULL,
  is_active    boolean DEFAULT true NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE meta_apps ENABLE ROW LEVEL SECURITY;

-- Only admin users can see/manage Meta app credentials
CREATE POLICY "admins manage meta_apps" ON meta_apps FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Link each registered WhatsApp number to the Meta app it was registered under
ALTER TABLE wa_numbers ADD COLUMN IF NOT EXISTS meta_app_id uuid REFERENCES meta_apps(id) ON DELETE SET NULL;

-- Seed: insert your current single Meta app so existing numbers keep working
-- Replace the values with your actual env var values from Render
-- INSERT INTO meta_apps (name, waba_id, access_token) VALUES
--   ('App 1 (Main)', '<WHATSAPP_BUSINESS_ACCOUNT_ID>', '<WHATSAPP_ACCESS_TOKEN>');
