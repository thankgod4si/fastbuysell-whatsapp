-- Allow bookings to reference products/catalog slugs (not only services_menu UUIDs)
-- and store free-text appointment times from the WhatsApp flow.

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;
ALTER TABLE bookings ALTER COLUMN service_id TYPE text USING service_id::text;
ALTER TABLE bookings ALTER COLUMN time_slot TYPE text USING time_slot::text;

-- Payment method chosen later (transfer/card) — provider is optional until set
ALTER TABLE booking_transactions ALTER COLUMN payment_gateway_provider DROP NOT NULL;
