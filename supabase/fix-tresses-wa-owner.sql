-- Fix Tresses Lagos WA number pointing at wrong user (FastBuySell legacy account).
-- Run once in Supabase SQL editor.

UPDATE wa_numbers
SET user_id = '9688c50d-76e9-49df-b817-5dfc4bb292c4'
WHERE phone_number_id = '1151743088022928';

-- Re-assign bookings created under the stale business_id
UPDATE bookings
SET business_id = '9688c50d-76e9-49df-b817-5dfc4bb292c4'
WHERE business_id = 'a8b2d00d-b17c-40b9-a519-3d860b745ee0';

UPDATE booking_transactions
SET business_id = '9688c50d-76e9-49df-b817-5dfc4bb292c4'
WHERE business_id = 'a8b2d00d-b17c-40b9-a519-3d860b745ee0';

UPDATE message_logs
SET user_id = '9688c50d-76e9-49df-b817-5dfc4bb292c4'
WHERE user_id = 'a8b2d00d-b17c-40b9-a519-3d860b745ee0';

UPDATE contacts
SET user_id = '9688c50d-76e9-49df-b817-5dfc4bb292c4'
WHERE user_id = 'a8b2d00d-b17c-40b9-a519-3d860b745ee0';
