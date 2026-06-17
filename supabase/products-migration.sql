-- =============================================================================
-- OutreachHQ — Products & Business Settings Migration
-- =============================================================================

-- 1. Auto-enable AI booking for all businesses (and new signups)
ALTER TABLE profiles ALTER COLUMN echoes_enabled SET DEFAULT true;
UPDATE profiles SET echoes_enabled = true WHERE echoes_enabled = false;

-- 2. Bank account details for transfer payments
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bank_name        text,
  ADD COLUMN IF NOT EXISTS account_number   text,
  ADD COLUMN IF NOT EXISTS account_name     text,
  ADD COLUMN IF NOT EXISTS booking_flow_id  text;    -- Meta Flow ID for this business's booking flow

-- 3. Products table
-- Businesses upload their products/services with images for the AI and booking flow
CREATE TABLE IF NOT EXISTS products (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  price           numeric     NOT NULL DEFAULT 0,
  currency        text        NOT NULL DEFAULT 'NGN',
  image_url       text,
  category        text,
  duration_mins   int,          -- null = product (not a timed service)
  is_available    boolean     DEFAULT true,
  is_popular      boolean     DEFAULT false,
  sort_order      int         DEFAULT 0,
  wa_item_id      text,         -- WhatsApp catalog product ID if synced
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_business  ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(business_id, is_available);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_owner"       ON products TO authenticated USING (business_id = auth.uid()) WITH CHECK (business_id = auth.uid());
CREATE POLICY "products_service_role" ON products TO service_role USING (true) WITH CHECK (true);

-- Auto-bump updated_at
CREATE TRIGGER touch_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 4. Seed demo products (uncomment and replace UUID)
-- INSERT INTO products (business_id, name, description, price, currency, duration_mins, is_popular, is_available)
-- VALUES
--   ('YOUR-UUID', 'Signature Blowout',   'Full wash, blow-dry & styling',       15000, 'NGN', 60,  true,  true),
--   ('YOUR-UUID', 'Classic Box Braids',  'Full head box braids or cornrows',    25000, 'NGN', 180, true,  true),
--   ('YOUR-UUID', 'Glow Facial',         'Deep cleanse + glow treatment',       18000, 'NGN', 75,  false, true),
--   ('YOUR-UUID', 'Mani & Pedi',         'Full nail care package',              12000, 'NGN', 90,  false, true),
--   ('YOUR-UUID', 'Wig Installation',    'Frontal/closure wig install & style', 30000, 'NGN', 120, true,  true);

-- 5. Demo bank account info
-- UPDATE profiles SET
--   bank_name = 'GTBank',
--   account_number = '0123456789',
--   account_name = 'Glam House Lagos'
-- WHERE id = 'YOUR-UUID';
