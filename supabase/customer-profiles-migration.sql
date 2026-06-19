-- Customer profiles per business (one row per customer phone per salon)
-- Powers: Hair Timeline, AI Hair Consultant, retention campaigns, customer wallet

CREATE TABLE IF NOT EXISTS customer_profiles (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone             text        NOT NULL,
  full_name         text,
  wa_name           text,
  email             text,
  birthday          date,
  hair_type         text,        -- e.g. 4c, relaxed, natural, colour-treated
  preferred_stylist text,
  loyalty_tier      text        DEFAULT 'standard' CHECK (loyalty_tier IN ('standard','silver','gold','vip')),
  loyalty_points    int         DEFAULT 0,
  last_visit_date   date,
  notes             text,        -- stylist / AI notes
  tags              text[]      DEFAULT '{}',
  metadata          jsonb       DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (business_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_business ON customer_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone    ON customer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_birthday ON customer_profiles(business_id, birthday);

-- Hair Timeline — every appointment / treatment updates the journey
CREATE TABLE IF NOT EXISTS hair_timeline (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id     uuid        NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  booking_id      uuid        REFERENCES bookings(id) ON DELETE SET NULL,
  event_type      text        NOT NULL DEFAULT 'appointment'
    CHECK (event_type IN ('appointment','product_purchase','consultation','note','campaign')),
  service_name    text,
  service_id      text,
  stylist         text,
  notes           text,
  event_date      date        NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hair_timeline_customer ON hair_timeline(customer_id, event_date DESC);

-- Customer wallet (prepaid balance spendable at the salon)
CREATE TABLE IF NOT EXISTS customer_wallets (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id     uuid        NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE UNIQUE,
  business_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance         numeric     NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency        text        NOT NULL DEFAULT 'NGN',
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_wallet_transactions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id       uuid        NOT NULL REFERENCES customer_wallets(id) ON DELETE CASCADE,
  business_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          numeric     NOT NULL,   -- positive = top-up, negative = spend
  currency        text        NOT NULL DEFAULT 'NGN',
  type            text        NOT NULL CHECK (type IN ('topup','spend','refund','bonus')),
  reference       text,
  booking_id      uuid        REFERENCES bookings(id) ON DELETE SET NULL,
  description     text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE customer_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_timeline         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_profiles_owner" ON customer_profiles
  FOR ALL TO authenticated USING (business_id = auth.uid()) WITH CHECK (business_id = auth.uid());

CREATE POLICY "hair_timeline_owner" ON hair_timeline
  FOR ALL TO authenticated USING (business_id = auth.uid()) WITH CHECK (business_id = auth.uid());

CREATE POLICY "customer_wallets_owner" ON customer_wallets
  FOR ALL TO authenticated USING (business_id = auth.uid()) WITH CHECK (business_id = auth.uid());

CREATE POLICY "customer_wallet_tx_owner" ON customer_wallet_transactions
  FOR ALL TO authenticated USING (business_id = auth.uid()) WITH CHECK (business_id = auth.uid());

CREATE POLICY "customer_profiles_service_role" ON customer_profiles TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hair_timeline_service_role"     ON hair_timeline     TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "customer_wallets_service_role"  ON customer_wallets  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "customer_wallet_tx_service_role" ON customer_wallet_transactions TO service_role USING (true) WITH CHECK (true);
