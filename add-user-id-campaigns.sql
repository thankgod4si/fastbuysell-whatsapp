-- Add user_id column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

-- Update existing campaigns to have user_id from associated campaign_contacts
-- This is a one-time migration for existing data
UPDATE campaigns 
SET user_id = (
  SELECT DISTINCT cc.user_id 
  FROM campaign_contacts cc 
  WHERE cc.campaign_id = campaigns.id 
  LIMIT 1
)
WHERE user_id IS NULL;
