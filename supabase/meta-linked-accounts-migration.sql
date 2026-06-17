-- Create table to store user-linked Meta accounts (FB pages, IG, WhatsApp)
CREATE TABLE IF NOT EXISTS linked_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meta_app_id uuid REFERENCES meta_apps(id) ON DELETE SET NULL,
  fb_page_id text,
  ig_user_id text,
  whatsapp_phone_id text,
  access_token text,
  scopes text[],
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage linked accounts" ON linked_accounts FOR ALL
  USING (auth.uid() = user_id);

-- Store temporary OAuth states for CSRF protection
CREATE TABLE IF NOT EXISTS oauth_states (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  state text NOT NULL,
  return_to text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage states" ON oauth_states FOR ALL
  USING (auth.uid() = user_id);
