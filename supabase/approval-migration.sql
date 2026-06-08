-- Run this in Supabase SQL Editor AFTER admin-migration.sql
-- Adds 'pending_approval' status and changes default for new signups

-- Extend the allowed statuses
alter table profiles drop constraint if exists profiles_subscription_status_check;
alter table profiles add constraint profiles_subscription_status_check
  check (subscription_status in ('pending_approval', 'trial', 'active', 'suspended'));

-- New users start as pending_approval (admin must approve before they can use the app)
alter table profiles alter column subscription_status set default 'pending_approval';

-- Existing users (already using the app) stay as-is — don't touch them
-- If you want to reset all existing non-admin users to pending, run:
-- update profiles set subscription_status = 'pending_approval' where is_admin = false;
