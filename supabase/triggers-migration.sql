-- Triggers table for keyword-based auto-replies across channels
CREATE TABLE IF NOT EXISTS triggers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  linked_account_id uuid REFERENCES linked_accounts(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','instagram','facebook','any')),
  match_type text NOT NULL CHECK (match_type IN ('contains','exact','regex')) DEFAULT 'contains',
  keyword text NOT NULL,
  reply_template text NOT NULL,
  auto_send boolean DEFAULT true NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage triggers" ON triggers FOR ALL USING (auth.uid() = user_id);
