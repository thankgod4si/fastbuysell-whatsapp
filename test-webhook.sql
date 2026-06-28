-- Test the auto-send webhook by inserting a pending message
-- This will trigger the Supabase webhook which calls /api/webhook/pending

INSERT INTO message_logs (
  contact_id,
  channel,
  recipient,
  content,
  msg_type,
  user_id,
  direction,
  status,
  created_at
) VALUES (
  'test-contact-' || gen_random_uuid(),
  'whatsapp',
  '+2348104965538',
  'Test message from auto-send webhook - this should arrive automatically!',
  'text',
  (SELECT id FROM profiles LIMIT 1),
  'outbound',
  'pending',
  NOW()
);

-- Check the status after a few seconds
SELECT id, recipient, content, status, sent_at, failure_reason 
FROM message_logs 
WHERE recipient = '+2348104965538' 
ORDER BY created_at DESC 
LIMIT 1;
