-- =============================================================================
-- ECHOES PLATFORM — Core Tables Migration
-- Multi-tenant: business_id = profiles.id (the Supabase auth user)
-- =============================================================================

-- 1. Extend profiles to flag Echoes-enabled businesses
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS echoes_enabled        boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS business_type         text,    -- 'salon' | 'spa' | 'restaurant'
  ADD COLUMN IF NOT EXISTS business_display_name text,
  ADD COLUMN IF NOT EXISTS business_logo_url     text,
  ADD COLUMN IF NOT EXISTS business_address      text,
  ADD COLUMN IF NOT EXISTS business_hours        jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_system_prompt      text,    -- Custom AI persona, auto-generated but editable
  ADD COLUMN IF NOT EXISTS wa_phone_number       text;    -- Human-readable e.g. +4915123456789

-- 2. Services Menu (the business's booking catalog)
CREATE TABLE IF NOT EXISTS services_menu (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_name  text        NOT NULL,
  description   text,
  price         numeric     NOT NULL CHECK (price >= 0),
  currency      text        NOT NULL DEFAULT 'NGN',  -- NGN, EUR, USD, GBP
  duration_mins int         NOT NULL DEFAULT 60,
  is_popular    boolean     DEFAULT false,
  is_active     boolean     DEFAULT true,
  sort_order    int         DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_menu_business ON services_menu(business_id);

-- 3. Booking Sessions (tracks the AI conversation state per customer)
CREATE TABLE IF NOT EXISTS booking_sessions (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_phone    text        NOT NULL,
  state             text        NOT NULL DEFAULT 'greeting'
    CHECK (state IN ('greeting','menu_shown','collecting_details','payment_sent','confirmed','cancelled')),
  collected_data    jsonb       DEFAULT '{}',   -- {customer_name, service_id, preferred_date, preferred_time}
  selected_service_id uuid      REFERENCES services_menu(id) ON DELETE SET NULL,
  context_messages  jsonb       DEFAULT '[]',   -- last 8 messages for AI context window
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_sessions_uniq
  ON booking_sessions(business_id, customer_phone)
  WHERE state NOT IN ('confirmed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_booking_sessions_business ON booking_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_booking_sessions_phone    ON booking_sessions(customer_phone);

-- 4. Bookings (confirmed appointments)
CREATE TABLE IF NOT EXISTS bookings (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id       uuid        REFERENCES booking_sessions(id) ON DELETE SET NULL,
  customer_name    text        NOT NULL,
  customer_phone   text        NOT NULL,
  service_id       uuid        NOT NULL REFERENCES services_menu(id) ON DELETE RESTRICT,
  appointment_date date        NOT NULL,
  time_slot        time        NOT NULL,
  notes            text,
  payment_status   text        NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_business    ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_phone       ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_date        ON bookings(appointment_date);

-- 5. Transactions (payment records)
CREATE TABLE IF NOT EXISTS booking_transactions (
  id                       uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id              uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id               uuid        REFERENCES bookings(id) ON DELETE SET NULL,
  amount                   numeric     NOT NULL,
  currency                 text        NOT NULL DEFAULT 'NGN',
  reference                text        UNIQUE,          -- Sofi/payment provider reference
  payment_gateway_provider text        NOT NULL DEFAULT 'sofi',
  status                   text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','success','failed','reversed')),
  gateway_response         jsonb       DEFAULT '{}',   -- raw webhook payload from provider
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_business  ON booking_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking   ON booking_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON booking_transactions(reference);

-- 6. RLS Policies (each business sees only its own data)
ALTER TABLE services_menu        ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_transactions ENABLE ROW LEVEL SECURITY;

-- Service menu: business owner reads/writes their own
CREATE POLICY "services_menu_owner" ON services_menu
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Bookings: business owner reads/writes their own
CREATE POLICY "bookings_owner" ON bookings
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Transactions: business owner reads their own
CREATE POLICY "transactions_owner" ON booking_transactions
  USING (business_id = auth.uid());

-- Sessions: business owner reads their own
CREATE POLICY "sessions_owner" ON booking_sessions
  USING (business_id = auth.uid());

-- Service role bypasses RLS (for webhook handlers)
CREATE POLICY "services_menu_service_role"        ON services_menu        TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "bookings_service_role"             ON bookings             TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "transactions_service_role"         ON booking_transactions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "booking_sessions_service_role"     ON booking_sessions     TO service_role USING (true) WITH CHECK (true);

-- 7. Helper function: updated_at auto-bump
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER touch_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_transactions_updated_at
  BEFORE UPDATE ON booking_transactions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_sessions_updated_at
  BEFORE UPDATE ON booking_sessions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 8. Seed demo data (one sample business for Monday's demo)
-- NOTE: Replace 'YOUR-DEMO-USER-UUID' with the actual Supabase user ID of your demo account
-- You can get it from: SELECT id FROM auth.users WHERE email = 'your@email.com';

-- UPDATE profiles SET
--   echoes_enabled = true,
--   business_type = 'salon',
--   business_display_name = 'Glam House Lagos',
--   business_address = 'Victoria Island, Lagos',
--   business_hours = '{"mon":"9am-7pm","tue":"9am-7pm","wed":"9am-7pm","thu":"9am-7pm","fri":"9am-8pm","sat":"9am-6pm","sun":"closed"}',
--   wa_phone_number = '+4915XXXXXXXX'
-- WHERE id = 'YOUR-DEMO-USER-UUID';

-- INSERT INTO services_menu (business_id, service_name, description, price, duration_mins, is_popular)
-- VALUES
--   ('YOUR-DEMO-USER-UUID', 'Signature Blowout', 'Full wash, blow-dry, and styling', 15000, 60, true),
--   ('YOUR-DEMO-USER-UUID', 'Classic Braids',    'Box braids or cornrows', 25000, 180, true),
--   ('YOUR-DEMO-USER-UUID', 'Facial Treatment',  'Deep cleanse and glow facial', 18000, 75, false),
--   ('YOUR-DEMO-USER-UUID', 'Manicure & Pedicure','Full nail care package', 12000, 90, false);
