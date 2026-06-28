-- Add failure_reason column to campaign_contacts table
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS failure_reason text;
