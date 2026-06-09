-- Run in Supabase SQL Editor
-- Adds generic lead columns so flows can capture anything, not just car data

alter table leads add column if not exists phone_number    text;
alter table leads add column if not exists company         text;
alter table leads add column if not exists product_service text;
alter table leads add column if not exists budget          text;
alter table leads add column if not exists location        text;
alter table leads add column if not exists timeline        text;
alter table leads add column if not exists response_data   jsonb; -- full raw flow response

-- Make old car-specific columns nullable (they are if you ran flows-migration.sql already)
alter table leads alter column car_make        drop not null;
alter table leads alter column car_model       drop not null;
alter table leads alter column car_year        drop not null;
alter table leads alter column mileage         drop not null;
alter table leads alter column asking_price    drop not null;
alter table leads alter column previous_owners drop not null;
