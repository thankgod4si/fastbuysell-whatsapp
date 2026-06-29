-- Add user_id column to campaign_contacts table
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_user_id ON campaign_contacts(user_id);

-- Update existing campaign_contacts to have user_id from associated campaigns
-- This is a one-time migration for existing data
UPDATE campaign_contacts 
SET user_id = (
  SELECT c.user_id 
  FROM campaigns c 
  WHERE c.id = campaign_contacts.campaign_id 
  LIMIT 1
)
WHERE user_id IS NULL;
