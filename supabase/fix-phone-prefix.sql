-- Fix phone numbers stored without '+' prefix
-- WhatsApp webhooks send numbers without '+', so older records may be missing it.

-- Fix contacts.phone
UPDATE contacts
SET phone = '+' || phone
WHERE phone NOT LIKE '+%'
  AND phone ~ '^\d';

-- Fix message_logs.recipient
UPDATE message_logs
SET recipient = '+' || recipient
WHERE recipient NOT LIKE '+%'
  AND recipient ~ '^\d';

-- Fix leads.phone
UPDATE leads
SET phone = '+' || phone
WHERE phone NOT LIKE '+%'
  AND phone IS NOT NULL
  AND phone ~ '^\d';
